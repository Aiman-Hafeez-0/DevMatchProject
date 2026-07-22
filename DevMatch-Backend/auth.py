from flask import Blueprint, request, jsonify, session
import psycopg2
import bcrypt
from db import get_db_connection

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({
            "user": {
                "id":                   session['user_id'],
                "user_name":            session.get('user_name'),
                "first_name":           session.get('first_name'),
                "is_profile_completed": session.get('is_profile_completed', False)
            }
        })
    else:
        return jsonify({"user": None}), 200


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return jsonify({'error': 'Please use POST method for registration'}), 405

    data = request.json
    user_name = data.get('user_name', '').strip()
    email_address = data.get('email_address', '').strip().lower()
    password = data.get('password')

    if not email_address or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute('SELECT * FROM users WHERE email_address = %s',
                    (email_address,))
        existing_user = cur.fetchone()
        if existing_user:
            return jsonify({'error': 'User already exists'}), 409

        cur.execute("""
            INSERT INTO users (user_name, email_address, password)
            VALUES (%s, %s, %s)
            RETURNING id;
        """, (user_name, email_address, hashed_password.decode('utf-8')))

        user_id = cur.fetchone()[0]
        conn.commit()

        session['user_id'] = user_id
        session['user_name'] = user_name
        session['is_profile_completed'] = False  # Default at registration

        cur.close()
        conn.close()

        return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201

    except Exception as e:
        print("Registration error:", e)
        return jsonify({'error': 'Registration failed'}), 500


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return jsonify({'message': 'Login is not possible — use POST with JSON data'}), 200

    data = request.json
    email_address = data.get('email_address', '').strip().lower()
    password = data.get('password')

    if not email_address or not password:
        return jsonify({'error': 'Email and password required'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_name, password, is_profile_completed, first_name
            FROM users
            WHERE email_address = %s
        """, (email_address,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user or not bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401

        session['user_id']             = user[0]
        session['user_name']           = user[1]
        session['is_profile_completed'] = user[3] if user[3] is not None else False
        session['first_name']          = user[4]

        return jsonify({
            'message':              'Login successful',
            'id':                   user[0],
            'user_name':            user[1],
            'first_name':           user[4],
            'is_profile_completed': user[3] if user[3] is not None else False
        }), 200

    except Exception as e:
        print("Login error:", e)
        return jsonify({'error': 'Login failed'}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/dashboard', methods=['GET'])
def dashboard():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    return jsonify({'message': f"Welcome {session['user_name']}!"}), 200


@auth_bp.route('/stats', methods=['GET'])
def get_stats():
    """Returns all dashboard stat counts for the logged-in user in one query."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                (SELECT COUNT(*)
                 FROM projects
                 WHERE owner_id = %s
                ) AS projects_owned,

                (SELECT COUNT(*)
                 FROM project_participants
                 WHERE user_id = %s AND status = 'accepted'
                ) AS projects_joined,

                (SELECT COUNT(*)
                 FROM project_participants pp
                 JOIN projects p ON pp.project_id = p.id
                 WHERE p.owner_id = %s AND pp.status = 'pending'
                ) AS pending_requests,

                (SELECT COUNT(*)
                 FROM project_chat_members
                 WHERE user_id = %s
                ) AS active_chats,

                (SELECT COUNT(*)
                 FROM notifications
                 WHERE user_id = %s AND is_read = false
                ) AS unread_notifications
        """, (user_id, user_id, user_id, user_id, user_id))

        row = cur.fetchone()
        cur.close()
        conn.close()

        return jsonify({
            'projects_owned':       row[0],
            'projects_joined':      row[1],
            'pending_requests':     row[2],
            'active_chats':         row[3],
            'unread_notifications': row[4],
        }), 200

    except Exception as e:
        print("Stats error:", e)
        return jsonify({'error': 'Could not load stats'}), 500
