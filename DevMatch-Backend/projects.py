from flask import Blueprint, request, jsonify, session
from db import get_db_connection
from flask import make_response
import json
import traceback
from psycopg2.extras import RealDictCursor

projects_bp = Blueprint('projects', __name__)


@projects_bp.route('/create', methods=['POST'])
def create_project():
    if 'user_id' not in session:
        return jsonify({'error': 'unauthorized'}), 401

    data = request.get_json()
    owner_id = session['user_id']

    title = data.get('title')
    description = data.get('description')
    tech_stack = data.get('tech_stack')
    github_repo = data.get('github_repo')
    urgency = data.get('urgency')
    is_private = data.get('is_private', False)
    problem_statements = data.get('problem_statements')
    is_paid = data.get('is_paid', False)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 1. Create the project
        cur.execute("""
            INSERT INTO projects (
                owner_id, title, description, tech_stack, github_repo,
                urgency, is_private, problem_statements, is_paid
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            owner_id, title, description, tech_stack, github_repo,
            urgency, is_private, problem_statements, is_paid
        ))
        project_id = cur.fetchone()['id']

        # 2. Create a chat room for this project immediately
        cur.execute("""
            INSERT INTO project_chat_rooms (project_id, created_at)
            VALUES (%s, NOW())
            ON CONFLICT (project_id) DO NOTHING
            RETURNING id
        """, (project_id,))
        room_row = cur.fetchone()

        if not room_row:
            # room already existed (shouldn't happen on create, but be safe)
            cur.execute("SELECT id FROM project_chat_rooms WHERE project_id = %s", (project_id,))
            room_row = cur.fetchone()

        room_id = room_row['id']

        # 3. Add owner as first member of the chat room
        cur.execute("""
            INSERT INTO project_chat_members (room_id, user_id, joined_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (room_id, user_id) DO NOTHING
        """, (room_id, owner_id))

        conn.commit()
        return jsonify({'message': 'Project created successfully!', 'project_id': project_id}), 201

    except Exception as e:
        conn.rollback()
        print("Error creating project:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/joined-projects', methods=['GET'])
def get_joined_projects():
    """Projects the logged-in user has been accepted into (not owned)."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT
                p.id, p.title, p.description, p.tech_stack,
                p.github_repo, p.urgency, p.is_paid, p.is_private,
                p.created_at, p.updated_at, p.owner_id,
                u.user_name AS owner_name,
                pp.joined_at
            FROM project_participants pp
            JOIN projects p ON p.id = pp.project_id
            JOIN users u ON u.id = p.owner_id
            WHERE pp.user_id = %s AND pp.status = 'accepted'
            ORDER BY pp.joined_at DESC
        """, (user_id,))
        projects = cur.fetchall()
        return jsonify(projects), 200
    except Exception as e:
        print("Error fetching joined projects:", e)
        return jsonify({'error': 'Database error'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/my-projects', methods=['GET'])
def get_my_projects():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(
            "SELECT * FROM projects WHERE owner_id = %s ORDER BY created_at DESC", (user_id,))
        projects = cur.fetchall()
        return jsonify(projects)
    except Exception as e:
        print("Error fetching projects:", e)
        return jsonify({'error': 'Database error'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/matches', methods=['GET'])
def get_matches():
    """
    Returns all projects the logged-in user hasn't joined/requested,
    each with a match_score (0-100) and matched_skills list
    based on overlap between user.skills and project.tech_stack.
    Sorted by match_score DESC.
    """
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Get the user's skills (stored as a Postgres ARRAY)
        cur.execute("SELECT skills, experience_level FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()

        user_skills = user_row['skills'] if user_row and user_row['skills'] else []
        # normalise to lowercase for case-insensitive comparison
        user_skills_lower = [s.lower().strip() for s in user_skills if s]

        if not user_skills_lower:
            cur.close()
            conn.close()
            return jsonify({'error': 'no_skills',
                            'message': 'Complete your profile with skills to see matches'}), 200

        # Fetch all projects the user doesn't own and hasn't requested/joined
        cur.execute("""
            SELECT
                p.id, p.title, p.description, p.tech_stack,
                p.urgency, p.is_paid, p.is_private,
                p.github_repo, p.created_at,
                p.owner_id, u.user_name AS owner_name
            FROM projects p
            JOIN users u ON u.id = p.owner_id
            WHERE p.owner_id != %s
              AND p.is_private = false
              AND p.id NOT IN (
                  SELECT project_id FROM project_participants WHERE user_id = %s
              )
            ORDER BY p.created_at DESC
        """, (user_id, user_id))

        projects = cur.fetchall()
        cur.close()
        conn.close()

        results = []
        for p in projects:
            # parse tech_stack — stored as text or postgres array string
            raw_tech = p['tech_stack'] or ''
            if isinstance(raw_tech, list):
                tech_list = raw_tech
            else:
                tech_list = [t.strip() for t in raw_tech.replace('{','').replace('}','').replace('"','').split(',') if t.strip()]

            tech_lower = [t.lower().strip() for t in tech_list]

            if not tech_lower:
                match_score = 0
                matched_skills = []
                missing_skills = []
            else:
                matched = [t for t in tech_lower if t in user_skills_lower]
                missing = [t for t in tech_lower if t not in user_skills_lower]
                match_score = round((len(matched) / len(tech_lower)) * 100)
                # return display-friendly names (original casing from tech_stack)
                matched_skills = [tech_list[tech_lower.index(m)] for m in matched]
                missing_skills = [tech_list[tech_lower.index(m)] for m in missing]

            results.append({
                'id':             p['id'],
                'title':          p['title'],
                'description':    p['description'],
                'tech_stack':     tech_list,
                'urgency':        p['urgency'],
                'is_paid':        p['is_paid'],
                'github_repo':    p['github_repo'],
                'created_at':     p['created_at'],
                'owner_id':       p['owner_id'],
                'owner_name':     p['owner_name'],
                'match_score':    match_score,
                'matched_skills': matched_skills,
                'missing_skills': missing_skills,
            })

        # sort by match score descending, then by recency
        results.sort(key=lambda x: (-x['match_score'], x['created_at'] or ''))

        return jsonify(results), 200

    except Exception as e:
        print("Error in get_matches:", e)
        return jsonify({'error': 'Could not compute matches'}), 500


@projects_bp.route('/all', methods=['GET'])
def get_all_projects():
    user_id = session.get('user_id')  # may be None for unauthenticated

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT
                p.id, p.title, p.description,
                p.tech_stack, p.urgency, p.is_paid,
                p.is_private, p.github_repo,
                p.created_at, p.updated_at,
                p.owner_id, u.user_name AS owner_name,
                pp.status AS participant_status
            FROM projects p
            JOIN users u ON u.id = p.owner_id
            LEFT JOIN project_participants pp
                   ON pp.project_id = p.id AND pp.user_id = %s
            WHERE p.is_private = false
            ORDER BY p.created_at DESC
        """, (user_id,))

        projects = cur.fetchall()
        return jsonify([dict(p) for p in projects]), 200

    except Exception as e:
        print('Error fetching projects:', e)
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/<int:project_id>', methods=['GET'])
def get_project_details(project_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Fetch project + owner
        cursor.execute("""
            SELECT p.*, u.user_name as owner_name
            FROM projects p
            JOIN users u ON p.owner_id = u.id
            WHERE p.id = %s
        """, (project_id,))
        project = cursor.fetchone()

        if not project:
            return jsonify({'error': 'Project not found'}), 404

        # Fetch tasks
        cursor.execute("""
            SELECT id, description AS statement
            FROM project_tasks
            WHERE project_id = %s
        """, (project_id,))
        tasks = cursor.fetchall()

        # 👇 Pack and print the final response
        project_details = {
            "id": project["id"],
            "title": project["title"],
            "description": project["description"],
            "created_at": project["created_at"],
            "updated_at": project["updated_at"],
            "is_paid": project["is_paid"],
            "tech_stack": project["tech_stack"],
            "github_repo": project["github_repo"],
            "urgency": project["urgency"],
            "owner_id": project["owner_id"],
            "owner_name": project["owner_name"],
            "problem_statements": project["problem_statements"],
            "tasks": tasks,
        }


        return jsonify(project_details)

    except Exception as e:
        print('❌ Error fetching project details:', str(e))
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        cursor.close()
        conn.close()

@projects_bp.route('/<int:project_id>/request', methods=['POST'])
def request_to_join_project(project_id):

    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    try:
        conn = get_db_connection()
    except Exception as e:
        print("DB connection error in join request:", e)
        return jsonify({'error': 'Could not connect to database'}), 500

    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Fetch project first so we can check is_private before allowing a direct request
        cur.execute("SELECT owner_id, title, is_private FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        if project['is_private']:
            return jsonify({
                'error': 'This is a private project. You need an invitation from the owner to join.'
            }), 403

        # Check if already requested or joined
        cur.execute("""
            SELECT status FROM project_participants
            WHERE project_id = %s AND user_id = %s
        """, (project_id, user_id))
        existing = cur.fetchone()

        if existing:
            return jsonify({'message': 'Already requested or joined', 'status': existing['status']}), 400

        # Insert into project_participants with status 'pending' and return the row id and status
        cur.execute("""
            INSERT INTO project_participants (project_id, user_id, status, joined_at)
            VALUES (%s, %s, 'pending', NOW())
            RETURNING id, project_id, user_id, status, joined_at
        """, (project_id, user_id))
        participant_row = cur.fetchone()

        owner_id = project['owner_id']

        # Get current user's username
        cur.execute("SELECT user_name FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()

        # Insert notification for owner and return the inserted notification
        message = f"{user['user_name']} requested to join your project '{project['title']}'"
        link = f"/project/requests/{project_id}"  # frontend route for handling

        cur.execute("""
            INSERT INTO notifications (user_id, message, type, link, data, created_at)
            VALUES (%s, %s, 'join_request', %s, %s, NOW())
            RETURNING *
        """, (owner_id, message, link, json.dumps({
            "project_id": project_id,
            "participant_id": user_id
        })))
        notification_row = cur.fetchone()

        conn.commit()

        return jsonify({
            'message': 'Join request sent',
            'participant': participant_row,
            'notification': notification_row
        }), 200

    except Exception as e:
        conn.rollback()
        print("Error in join request:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@projects_bp.route('/notifications', methods=['GET'])
def get_notifications():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT * FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        notifications = cur.fetchall()
        return jsonify(notifications)
    except Exception as e:
        print("Error fetching notifications:", e)
        return jsonify({'error': 'Server error'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/notifications/clear', methods=['DELETE'])
def clear_all_notifications():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("DELETE FROM notifications WHERE user_id = %s", (user_id,))
        conn.commit()
        return jsonify({'message': 'All notifications cleared'}), 200
    except Exception as e:
        conn.rollback()
        print("Error clearing notifications:", e)
        return jsonify({'error': 'Something went wrong'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
def dismiss_notification(notification_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # the user_id check ensures someone can only dismiss their own notifications
        cur.execute("""
            DELETE FROM notifications
            WHERE id = %s AND user_id = %s
        """, (notification_id, user_id))

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({'error': 'Notification not found'}), 404

        conn.commit()
        return jsonify({'message': 'Notification dismissed'}), 200
    except Exception as e:
        conn.rollback()
        print("Error dismissing notification:", e)
        return jsonify({'error': 'Something went wrong'}), 500
    finally:
        cur.close()
        conn.close()

@projects_bp.route('/<int:project_id>/accept/<int:user_id>', methods=['PUT'])
def accept_join_request(project_id, user_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    owner_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # verify the logged-in user actually owns this project
        cur.execute("SELECT owner_id, title FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if project['owner_id'] != owner_id:
            return jsonify({'error': 'Forbidden'}), 403

        # only accept if the request is still pending — blocks accept+reject races
        cur.execute("""
            UPDATE project_participants
            SET status = 'accepted', joined_at = NOW()
            WHERE project_id = %s AND user_id = %s AND status = 'pending'
        """, (project_id, user_id))

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({'error': 'Request already processed'}), 409

        # ensure a chat room exists for this project (should already exist from create_project)
        cur.execute("""
            INSERT INTO project_chat_rooms (project_id, created_at)
            VALUES (%s, NOW())
            ON CONFLICT (project_id) DO NOTHING
        """, (project_id,))

        # get the room id
        cur.execute("SELECT id FROM project_chat_rooms WHERE project_id = %s", (project_id,))
        room_row = cur.fetchone()
        room_id = room_row['id'] if room_row else None

        # add BOTH owner and new member to project_chat_members with explicit conflict column
        if room_id:
            cur.execute("""
                INSERT INTO project_chat_members (room_id, user_id, joined_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (room_id, user_id) DO NOTHING
            """, (room_id, owner_id))
            cur.execute("""
                INSERT INTO project_chat_members (room_id, user_id, joined_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (room_id, user_id) DO NOTHING
            """, (room_id, user_id))

        # remove the original join-request notification so it stops showing in the bell
        cur.execute("""
            DELETE FROM notifications
            WHERE user_id = %s AND type = 'join_request'
              AND (data::jsonb->>'project_id')::int = %s
              AND (data::jsonb->>'participant_id')::int = %s
        """, (owner_id, project_id, user_id))

        # notify requester
        message = f"Your request to join '{project['title']}' has been accepted. You can now start chatting!"
        link = f"/chat/project/{project_id}"

        cur.execute("""
            INSERT INTO notifications (user_id, message, type, link, data, created_at)
            VALUES (%s, %s, 'join_accept', %s, %s, NOW())
        """, (
            user_id,
            message,
            link,
            json.dumps({
                "project_id": project_id,
                "owner_id": owner_id
            })
        ))

        conn.commit()
        return jsonify({'message': 'Request accepted'}), 200

    except Exception as e:
        conn.rollback()
        print("Error in accept_join_request:", e)
        return jsonify({'error': 'Something went wrong'}), 500

    finally:
        cur.close()
        conn.close()


@projects_bp.route('/<int:project_id>/reject/<int:user_id>', methods=['DELETE'])
def reject_join_request(project_id, user_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    owner_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # verify the logged-in user actually owns this project
        cur.execute("SELECT owner_id, title FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if project['owner_id'] != owner_id:
            return jsonify({'error': 'Forbidden'}), 403

        # only reject if the request is still pending — blocks accept+reject races
        cur.execute("""
            DELETE FROM project_participants
            WHERE project_id = %s AND user_id = %s AND status = 'pending'
        """, (project_id, user_id))

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({'error': 'Request already processed'}), 409

        # remove the original join-request notification so it stops showing in the bell
        cur.execute("""
            DELETE FROM notifications
            WHERE user_id = %s AND type = 'join_request'
              AND (data::jsonb->>'project_id')::int = %s
              AND (data::jsonb->>'participant_id')::int = %s
        """, (owner_id, project_id, user_id))

        # notify requester
        message = f"Your request to join '{project['title']}' was declined or removed."
        link = f"/projects/{project_id}"

        cur.execute("""
            INSERT INTO notifications (user_id, message, type, link, data, created_at)
            VALUES (%s, %s, 'join_reject', %s, %s, NOW())
        """, (
            user_id,
            message,
            link,
            json.dumps({
                "project_id": project_id,
                "owner_id": owner_id
            })
        ))

        conn.commit()
        return jsonify({'message': 'Request deleted'}), 200

    except Exception as e:
        conn.rollback()
        print("Error in reject_join_request:", e)
        return jsonify({'error': 'Something went wrong'}), 500

    finally:
        cur.close()
        conn.close()




@projects_bp.route('/participant-status', methods=['POST'])
def get_participant_status():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    project_id = data.get('project_id')
    user_id = session['user_id']

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT status FROM project_participants
            WHERE project_id = %s AND user_id = %s
        """, (project_id, user_id))
        participant = cur.fetchone()

        if participant:
            return jsonify({'status': participant['status']})
        else:
            return jsonify({'status': None})
    except Exception as e:
        print("Status check error:", e)
        return jsonify({'error': 'Error checking status'}), 500
    finally:
        cur.close()
        conn.close()



@projects_bp.route('/<int:project_id>', methods=['PUT'])
def edit_project(project_id):
    """Owner edits their project details."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    owner_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT owner_id FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if project['owner_id'] != owner_id:
            return jsonify({'error': 'Forbidden'}), 403

        data = request.get_json()

        # only update fields that were actually sent
        allowed = ['title', 'description', 'tech_stack', 'github_repo',
                   'urgency', 'is_private', 'problem_statements', 'is_paid']
        updates = {k: data[k] for k in allowed if k in data}

        if not updates:
            return jsonify({'error': 'No fields to update'}), 400

        set_clause = ", ".join(f"{k} = %s" for k in updates)
        set_clause += ", updated_at = NOW()"
        values = list(updates.values()) + [project_id]

        cur.execute(f"UPDATE projects SET {set_clause} WHERE id = %s", values)
        conn.commit()
        return jsonify({'message': 'Project updated successfully'}), 200

    except Exception as e:
        conn.rollback()
        print("Error editing project:", e)
        return jsonify({'error': 'Could not update project'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Owner permanently deletes their project and all related data."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    owner_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT owner_id FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if project['owner_id'] != owner_id:
            return jsonify({'error': 'Forbidden'}), 403

        # cascade delete: participants, chat members, messages, rooms, notifications, tasks
        cur.execute("DELETE FROM project_participants WHERE project_id = %s", (project_id,))
        cur.execute("DELETE FROM project_tasks WHERE project_id = %s", (project_id,))
        cur.execute("""
            DELETE FROM project_chat_members
            WHERE room_id IN (SELECT id FROM project_chat_rooms WHERE project_id = %s)
        """, (project_id,))
        cur.execute("""
            DELETE FROM project_chat_messages
            WHERE room_id IN (SELECT id FROM project_chat_rooms WHERE project_id = %s)
        """, (project_id,))
        cur.execute("DELETE FROM project_chat_rooms WHERE project_id = %s", (project_id,))
        cur.execute("DELETE FROM notifications WHERE data::jsonb->>'project_id' = %s", (str(project_id),))
        cur.execute("DELETE FROM projects WHERE id = %s", (project_id,))

        conn.commit()
        return jsonify({'message': 'Project deleted'}), 200

    except Exception as e:
        conn.rollback()
        print("Error deleting project:", e)
        return jsonify({'error': 'Could not delete project'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/<int:project_id>/members/<int:member_id>', methods=['DELETE'])
def remove_member(project_id, member_id):
    """Owner removes an accepted member from the project and its chat room."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    owner_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT owner_id FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if project['owner_id'] != owner_id:
            return jsonify({'error': 'Forbidden'}), 403
        if member_id == owner_id:
            return jsonify({'error': 'Owner cannot remove themselves'}), 400

        # remove from project participants
        cur.execute("""
            DELETE FROM project_participants
            WHERE project_id = %s AND user_id = %s
        """, (project_id, member_id))

        # remove from chat room
        cur.execute("""
            DELETE FROM project_chat_members pcm
            USING project_chat_rooms pcr
            WHERE pcm.room_id = pcr.id
              AND pcr.project_id = %s
              AND pcm.user_id = %s
        """, (project_id, member_id))

        conn.commit()
        return jsonify({'message': 'Member removed successfully'}), 200

    except Exception as e:
        conn.rollback()
        print("Error removing member:", e)
        return jsonify({'error': 'Could not remove member'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/joined', methods=['GET'])
def get_joined_projects_alt():
    """Projects where the logged-in user is an accepted participant (not owner)."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT
                p.id, p.title, p.description, p.tech_stack, p.urgency,
                p.is_paid, p.is_private, p.github_repo, p.created_at,
                p.owner_id, u.user_name AS owner_name, pp.joined_at
            FROM project_participants pp
            JOIN projects p ON pp.project_id = p.id
            JOIN users u ON u.id = p.owner_id
            WHERE pp.user_id = %s AND pp.status = 'accepted'
            ORDER BY pp.joined_at DESC
        """, (user_id,))
        return jsonify(cur.fetchall()), 200
    except Exception as e:
        print("get_joined_projects error:", e)
        return jsonify({'error': 'Database error'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/pending-requests', methods=['GET'])
def get_pending_requests():
    """All pending join requests across all projects the logged-in user owns."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    owner_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT
                pp.id AS participant_id,
                pp.user_id,
                u.user_name, u.first_name, u.last_name,
                u.skills, u.experience_level, u.github_url,
                pp.project_id, p.title AS project_title,
                pp.joined_at AS requested_at
            FROM project_participants pp
            JOIN projects p ON pp.project_id = p.id
            JOIN users u ON u.id = pp.user_id
            WHERE p.owner_id = %s AND pp.status = 'pending'
            ORDER BY pp.joined_at DESC
        """, (owner_id,))
        rows = cur.fetchall()
        result = []
        for r in rows:
            row = dict(r)
            raw = row.get('skills') or []
            if isinstance(raw, str):
                raw = [s.strip() for s in raw.replace('{','').replace('}','').replace('"','').split(',') if s.strip()]
            row['skills'] = raw
            row['requested_at'] = r['requested_at'].isoformat() if r['requested_at'] else None
            result.append(row)
        return jsonify(result), 200
    except Exception as e:
        print("get_pending_requests error:", e)
        return jsonify({'error': 'Database error'}), 500
    finally:
        cur.close()
        conn.close()


# ============================================================
#  PRIVATE PROJECT INVITES
# ============================================================

@projects_bp.route('/<int:project_id>/invite', methods=['POST', 'OPTIONS'])
def invite_user(project_id):
    """Owner invites a specific user by username — only way into a private project."""
    if request.method == 'OPTIONS':
        return '', 204

    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    owner_id = session['user_id']

    try:
        data = request.get_json(silent=True) or {}
        target_username = (data.get('username') or '').strip()

        if not target_username:
            return jsonify({'error': 'Username is required'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("SELECT owner_id, title FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if project['owner_id'] != owner_id:
            return jsonify({'error': 'Only the owner can invite members'}), 403

        cur.execute("SELECT id, user_name FROM users WHERE LOWER(user_name) = LOWER(%s)", (target_username,))
        target_user = cur.fetchone()
        if not target_user:
            return jsonify({'error': f'No user found with username "{target_username}"'}), 404

        if target_user['id'] == owner_id:
            return jsonify({'error': "You can't invite yourself"}), 400

        cur.execute("""
            SELECT status FROM project_participants WHERE project_id = %s AND user_id = %s
        """, (project_id, target_user['id']))
        existing = cur.fetchone()
        if existing:
            return jsonify({'error': f'Already {existing["status"]} on this project'}), 400

        cur.execute("""
            INSERT INTO project_participants (project_id, user_id, status, joined_at)
            VALUES (%s, %s, 'invited', NOW())
        """, (project_id, target_user['id']))

        message = f"You've been invited to join the project '{project['title']}'"
        link = f"/projects/{project_id}"

        cur.execute("""
            INSERT INTO notifications (user_id, message, type, link, data, created_at)
            VALUES (%s, %s, 'project_invite', %s, %s, NOW())
        """, (target_user['id'], message, link, json.dumps({
            "project_id": project_id,
            "owner_id": owner_id
        })))

        conn.commit()
        return jsonify({'message': f'Invitation sent to {target_user["user_name"]}'}), 200

    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        print("Error inviting user:", e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass


@projects_bp.route('/<int:project_id>/invite/accept', methods=['PUT'])
def accept_invite(project_id):
    """Invited user accepts — joins the project and chat room, same pipeline as a normal accept."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            UPDATE project_participants
            SET status = 'accepted', joined_at = NOW()
            WHERE project_id = %s AND user_id = %s AND status = 'invited'
        """, (project_id, user_id))

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({'error': 'No pending invite found'}), 409

        cur.execute("SELECT owner_id, title FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        owner_id = project['owner_id']

        # ensure chat room exists and add both owner + invitee — same as accept_join_request
        cur.execute("""
            INSERT INTO project_chat_rooms (project_id, created_at)
            VALUES (%s, NOW())
            ON CONFLICT (project_id) DO NOTHING
        """, (project_id,))
        cur.execute("SELECT id FROM project_chat_rooms WHERE project_id = %s", (project_id,))
        room_id = cur.fetchone()['id']

        cur.execute("""
            INSERT INTO project_chat_members (room_id, user_id, joined_at)
            VALUES (%s, %s, NOW()) ON CONFLICT (room_id, user_id) DO NOTHING
        """, (room_id, owner_id))
        cur.execute("""
            INSERT INTO project_chat_members (room_id, user_id, joined_at)
            VALUES (%s, %s, NOW()) ON CONFLICT (room_id, user_id) DO NOTHING
        """, (room_id, user_id))

        # clear the invite notification
        cur.execute("""
            DELETE FROM notifications
            WHERE user_id = %s AND type = 'project_invite'
              AND (data::jsonb->>'project_id')::int = %s
        """, (user_id, project_id))

        # notify the owner that their invite was accepted
        cur.execute("SELECT user_name FROM users WHERE id = %s", (user_id,))
        invitee_name = cur.fetchone()['user_name']

        cur.execute("""
            INSERT INTO notifications (user_id, message, type, link, data, created_at)
            VALUES (%s, %s, 'invite_accepted', %s, %s, NOW())
        """, (
            owner_id,
            f"{invitee_name} accepted your invite to '{project['title']}'. You can now start chatting!",
            f"/chat/project/{project_id}",
            json.dumps({"project_id": project_id, "user_id": user_id})
        ))

        conn.commit()
        return jsonify({'message': f"Joined '{project['title']}'!"}), 200

    except Exception as e:
        conn.rollback()
        print("Error accepting invite:", e)
        return jsonify({'error': 'Could not accept invite'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/<int:project_id>/invite/decline', methods=['DELETE'])
def decline_invite(project_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT project_id FROM project_participants
            WHERE project_id = %s AND user_id = %s AND status = 'invited'
        """, (project_id, user_id))
        if not cur.fetchone():
            conn.rollback()
            return jsonify({'error': 'No pending invite found'}), 409

        cur.execute("SELECT owner_id, title FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()

        cur.execute("SELECT user_name FROM users WHERE id = %s", (user_id,))
        invitee_name = cur.fetchone()['user_name']

        cur.execute("""
            DELETE FROM project_participants
            WHERE project_id = %s AND user_id = %s AND status = 'invited'
        """, (project_id, user_id))

        cur.execute("""
            DELETE FROM notifications
            WHERE user_id = %s AND type = 'project_invite'
              AND (data::jsonb->>'project_id')::int = %s
        """, (user_id, project_id))

        # notify the owner that their invite was declined
        cur.execute("""
            INSERT INTO notifications (user_id, message, type, link, data, created_at)
            VALUES (%s, %s, 'invite_declined', %s, %s, NOW())
        """, (
            project['owner_id'],
            f"{invitee_name} declined your invite to '{project['title']}'",
            f"/owner/projects",
            json.dumps({"project_id": project_id, "user_id": user_id})
        ))

        conn.commit()
        return jsonify({'message': 'Invite declined'}), 200
    except Exception as e:
        conn.rollback()
        print("Error declining invite:", e)
        return jsonify({'error': 'Could not decline invite'}), 500
    finally:
        cur.close()
        conn.close()


# ============================================================
#  CONTRIBUTION LEDGER — credibility / problem-statement attribution
# ============================================================

@projects_bp.route('/<int:project_id>/contributions', methods=['POST'])
def give_credit(project_id):
    """
    Owner attests that a specific contributor solved a specific problem statement
    on this project — the core credibility-building action.
    """
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    owner_id = session['user_id']
    data = request.get_json()
    contributor_id = data.get('contributor_id')
    problem_statement = (data.get('problem_statement') or '').strip()
    is_paid = bool(data.get('is_paid', False))
    stars = data.get('stars')
    note = (data.get('note') or '').strip()

    if not contributor_id or not problem_statement:
        return jsonify({'error': 'contributor_id and problem_statement are required'}), 400
    try:
        stars = int(stars)
        if stars < 1 or stars > 5:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'error': 'stars must be an integer from 1 to 5'}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT owner_id, title FROM projects WHERE id = %s", (project_id,))
        project = cur.fetchone()
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if project['owner_id'] != owner_id:
            return jsonify({'error': 'Only the project owner can give credit'}), 403

        # contributor must be an accepted member of this project
        cur.execute("""
            SELECT 1 FROM project_participants
            WHERE project_id = %s AND user_id = %s AND status = 'accepted'
        """, (project_id, contributor_id))
        if not cur.fetchone():
            return jsonify({'error': 'This person is not an accepted member of this project'}), 400

        cur.execute("""
            INSERT INTO contributions
                (project_id, problem_statement, contributor_id, attested_by, is_paid, stars, note, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (project_id, problem_statement, contributor_id, owner_id, is_paid, stars, note))
        contribution_id = cur.fetchone()['id']

        # notify the contributor they received credit
        cur.execute("""
            INSERT INTO notifications (user_id, message, type, link, data, created_at)
            VALUES (%s, %s, 'credit_received', %s, %s, NOW())
        """, (
            contributor_id,
            f"You were credited for solving '{problem_statement[:60]}' on '{project['title']}'",
            f"/profile/{contributor_id}",
            json.dumps({"project_id": project_id, "contribution_id": contribution_id})
        ))

        conn.commit()
        return jsonify({'message': 'Credit given', 'contribution_id': contribution_id}), 201

    except Exception as e:
        conn.rollback()
        print("Error giving credit:", e)
        return jsonify({'error': 'Could not give credit'}), 500
    finally:
        cur.close()
        conn.close()


@projects_bp.route('/<int:project_id>/contributions', methods=['GET'])
def get_project_contributions(project_id):
    """List all credit given on this project — lets the owner avoid double-crediting."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT c.id, c.problem_statement, c.is_paid, c.stars, c.note, c.created_at,
                   c.contributor_id, u.user_name AS contributor_name
            FROM contributions c
            JOIN users u ON u.id = c.contributor_id
            WHERE c.project_id = %s
            ORDER BY c.created_at DESC
        """, (project_id,))
        rows = cur.fetchall()
        for r in rows:
            r['created_at'] = r['created_at'].isoformat() if r['created_at'] else None
        return jsonify(rows), 200
    except Exception as e:
        print("Error fetching contributions:", e)
        return jsonify({'error': 'Database error'}), 500
    finally:
        cur.close()
        conn.close()
