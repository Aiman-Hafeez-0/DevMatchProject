from flask import Blueprint, session, jsonify, request, current_app
from flask_socketio import emit, join_room
from db import get_db_connection
from socketio_instance import socketio
from datetime import datetime, timezone
import os, uuid, mimetypes

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/my-chats", methods=["GET"])
def get_my_chats():
    """
    Returns all project chats the logged-in user belongs to,
    ordered by most recent message. Uses project_chat_members as
    single source of truth — always accurate after migration + create_project fix.
    """
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                pcr.id           AS room_id,
                p.id             AS project_id,
                p.title          AS project_title,
                p.owner_id,
                lm.message       AS last_message,
                lm.sent_at       AS last_message_at,
                lm.sender_id     AS last_sender_id
            FROM project_chat_members pcm
            JOIN project_chat_rooms pcr ON pcm.room_id = pcr.id
            JOIN projects p             ON pcr.project_id = p.id
            LEFT JOIN LATERAL (
                SELECT message, sent_at, sender_id
                FROM project_chat_messages
                WHERE room_id = pcr.id
                ORDER BY sent_at DESC
                LIMIT 1
            ) lm ON true
            WHERE pcm.user_id = %s
            ORDER BY COALESCE(lm.sent_at, pcr.created_at) DESC
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify([
            {
                "room_id":        r[0],
                "project_id":     r[1],
                "project_title":  r[2],
                "owner_id":       r[3],
                "last_message":   r[4],
                "last_message_at": r[5].isoformat() if r[5] else None,
                "last_sender_id": r[6],
            }
            for r in rows
        ]), 200

    except Exception as e:
        print("Error in get_my_chats:", e)
        return jsonify({"error": "Could not load your chats"}), 500


@chat_bp.route("/upload", methods=["POST"])
def upload_file():
    """
    Accepts a file upload, saves it to disk, returns its public URL.
    Called by the frontend before emitting the socket message.
    """
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    # allowed types — images and common docs
    ALLOWED_EXTENSIONS = {
        "png", "jpg", "jpeg", "gif", "webp",       # images
        "pdf", "doc", "docx", "txt", "csv",         # docs
        "zip", "mp4", "mp3",                         # misc
    }
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"File type .{ext} not allowed"}), 400

    # give it a unique name so filenames never clash
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "chat")
    os.makedirs(save_dir, exist_ok=True)
    file.save(os.path.join(save_dir, unique_name))

    # Build the URL from the actual request host so this works both locally
    # and once deployed (avoids hardcoding localhost, which would break in production)
    file_url = f"{request.host_url.rstrip('/')}/uploads/chat/{unique_name}"
    return jsonify({"file_url": file_url, "original_name": file.filename}), 200


@chat_bp.route("/unread-count", methods=["GET"])
def get_unread_count():
    """
    Returns how many chat rooms have at least one new message
    since this user last opened them — powers the nav badge on Chats.
    """
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT COUNT(*)
            FROM project_chat_members pcm
            WHERE pcm.user_id = %s
              AND EXISTS (
                  SELECT 1 FROM project_chat_messages m
                  WHERE m.room_id = pcm.room_id
                    AND m.sender_id != %s
                    AND m.sent_at > COALESCE(pcm.last_read_at, '1970-01-01')
              )
        """, (user_id, user_id))

        unread_rooms = cur.fetchone()[0]
        cur.close()
        conn.close()

        return jsonify({"unread_rooms": unread_rooms}), 200

    except Exception as e:
        print("Error in get_unread_count:", e)
        return jsonify({"error": "Could not fetch unread count"}), 500


@chat_bp.route("/room/<int:project_id>", methods=["GET"])
def get_room(project_id):
    """
    Returns room_id + member list for a project.
    Access is gated by project_chat_members — if you're not in it, you're denied.
    """
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # get the room, verify membership, and fetch owner_id in one query
        cur.execute("""
            SELECT pcr.id AS room_id, p.owner_id
            FROM project_chat_rooms pcr
            JOIN project_chat_members pcm ON pcm.room_id = pcr.id
            JOIN projects p ON p.id = pcr.project_id
            WHERE pcr.project_id = %s AND pcm.user_id = %s
        """, (project_id, user_id))

        row = cur.fetchone()

        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "Access denied — you are not a member of this chat"}), 403

        room_id, owner_id = row[0], row[1]

        # fetch member list with usernames
        cur.execute("""
            SELECT u.id, u.user_name
            FROM project_chat_members pcm
            JOIN users u ON u.id = pcm.user_id
            WHERE pcm.room_id = %s
            ORDER BY pcm.joined_at ASC
        """, (room_id,))

        members = [{"id": m[0], "user_name": m[1]} for m in cur.fetchall()]

        # mark this room as read for this user now that they've opened it
        cur.execute("""
            UPDATE project_chat_members
            SET last_read_at = NOW()
            WHERE room_id = %s AND user_id = %s
        """, (room_id, user_id))
        conn.commit()

        cur.close()
        conn.close()

        return jsonify({"room_id": room_id, "owner_id": owner_id, "members": members}), 200

    except Exception as e:
        print("Error in get_room:", e)
        return jsonify({"error": "Could not load chat room"}), 500


@chat_bp.route("/messages/<int:room_id>", methods=["GET"])
def get_messages(room_id):
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # verify membership
        cur.execute("""
            SELECT 1 FROM project_chat_members WHERE room_id = %s AND user_id = %s
        """, (room_id, user_id))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Access denied"}), 403

        cur.execute("""
            SELECT
                m.sender_id,
                u.user_name  AS sender_name,
                m.message,
                m.file_url,
                m.sent_at
            FROM project_chat_messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.room_id = %s
            ORDER BY m.sent_at ASC
        """, (room_id,))

        messages = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify([
            {
                "sender_id":   m[0],
                "sender_name": m[1],
                "message":     m[2],
                "file_url":    m[3],
                "sent_at":     m[4].isoformat() if m[4] else None,
            }
            for m in messages
        ]), 200

    except Exception as e:
        print("Error fetching messages:", e)
        return jsonify({"error": "Could not load messages"}), 500


@socketio.on("join_room")
def handle_join(data):
    room_id = data.get("room_id")
    if not room_id:
        return
    join_room(str(room_id))
    emit("joined", {"room_id": room_id})


@socketio.on("send_message")
def handle_send(data):
    user_id = session.get("user_id")
    if not user_id:
        emit("error", {"message": "Unauthorized"})
        return

    room_id  = data.get("room_id")
    message  = data.get("message", "").strip()
    file_url = data.get("file_url", None)
    original_name = data.get("original_name", None)

    # must have at least a message or a file
    if not room_id or (not message and not file_url):
        emit("error", {"message": "Missing room or content"})
        return

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT 1 FROM project_chat_members WHERE room_id = %s AND user_id = %s
        """, (room_id, user_id))
        if not cur.fetchone():
            emit("error", {"message": "You are not a member of this chat"})
            cur.close()
            conn.close()
            return

        cur.execute("""
            INSERT INTO project_chat_messages (room_id, sender_id, message, file_url)
            VALUES (%s, %s, %s, %s)
            RETURNING sent_at
        """, (room_id, user_id, message or None, file_url))

        row = cur.fetchone()

        cur.execute("SELECT user_name FROM users WHERE id = %s", (user_id,))
        name_row = cur.fetchone()
        sender_name = name_row[0] if name_row else "Unknown"

        conn.commit()
        cur.close()
        conn.close()

        sent_at = row[0].isoformat() if row and row[0] else datetime.now(timezone.utc).isoformat()

        emit("new_message", {
            "sender_id":     user_id,
            "sender_name":   sender_name,
            "message":       message or None,
            "file_url":      file_url,
            "original_name": original_name,
            "sent_at":       sent_at,
        }, room=str(room_id), include_self=True)

    except Exception as e:
        print("Error sending message:", e)
        emit("error", {"message": "Failed to send message"})
