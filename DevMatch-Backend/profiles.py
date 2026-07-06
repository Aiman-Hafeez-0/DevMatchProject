from flask import Blueprint, request, jsonify, session
from db import get_db_connection
from psycopg2.extras import RealDictCursor
import traceback
import traceback

profiles_bp = Blueprint('profiles', __name__)


@profiles_bp.route('/profile', methods=['GET', 'PUT'])
def profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if request.method == 'GET':
        try:
            cur.execute("""
                SELECT id, user_name AS username, first_name, last_name, email_address AS email,
                       skills, experience_level, github_url,
                       availability, bio, is_profile_completed
                FROM users
                WHERE id = %s
            """, (user_id,))
            user = cur.fetchone()
            if user:
                return jsonify(user), 200
            else:
                return jsonify({'error': 'User not found'}), 404
        finally:
            cur.close()
            conn.close()

    # PUT method
    elif request.method == 'PUT':
        try:
            data = request.get_json()

            # Convert skills to list if it’s a comma-separated string
            if 'skills' in data and isinstance(data['skills'], str):
                data['skills'] = [s.strip()
                                  for s in data['skills'].split(',') if s.strip()]

            field_mapping = {
                'first_name': 'first_name',
                'last_name': 'last_name',
                'email': 'email_address',
                'username': 'user_name',
                'skills': 'skills',
                'experience_level': 'experience_level',
                'github_url': 'github_url',
                'availability': 'availability',
                'bio': 'bio'
            }

            update_data = {
                db_field: data.get(form_field)
                for form_field, db_field in field_mapping.items()
                if data.get(form_field) is not None
            }

            if not update_data:
                return jsonify({'error': 'No valid fields to update'}), 400

            set_clause = ", ".join([f"{field} = %s" for field in update_data])
            set_clause += ", is_profile_completed = TRUE"
            values = list(update_data.values())
            values.append(user_id)


            cur.execute(f"""
                UPDATE users
                SET {set_clause}
                WHERE id = %s
            """, values)

            conn.commit()
            session['is_profile_completed'] = True
            if 'first_name' in data:
                session['first_name'] = data['first_name']
            if 'username' in data:
                session['user_name'] = data['username']

            return jsonify({'message': 'Profile updated successfully'}), 200

        except Exception as e:
            print("Profile update error:", e)
            traceback.print_exc()
            conn.rollback()
            return jsonify({'error': 'Internal server error'}), 500

        finally:
            cur.close()
            conn.close()


@profiles_bp.route('/seeker/profile', methods=['GET'])
def get_seeker_profile():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    user_id = session['user_id']

    cursor.execute("""
        SELECT id, user_name, first_name, last_name, email_address,
               skills, experience_level, github_url,
               availability, bio, is_profile_completed
        FROM users WHERE id = %s
    """, (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        return jsonify(user), 200
    else:
        return jsonify({'message': 'User not found'}), 404


@profiles_bp.route('/all', methods=['GET'])
def get_all_profiles():
    db = get_db_connection()
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT id, user_name, first_name, last_name, skills, experience_level,
                   availability, bio, github_url, is_profile_completed
            FROM users
        """)
        rows = cursor.fetchall()
        users = [
            {
                "id": row[0],
                "user_name": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "skills": row[4],
                "experience_level": row[5],
                "availability": row[6],
                "bio": row[7],
                "github_url": row[8],
                "is_profile_completed": row[9]
            }
            for row in rows
        ]
        return jsonify(users), 200
    except Exception as e:
        print("Error fetching profiles:", e)
        return jsonify({"error": "Failed to fetch profiles"}), 500


@profiles_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Public profile view for any user — no email or password returned."""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Core profile
        cur.execute("""
            SELECT id, user_name, first_name, last_name,
                   skills, experience_level, github_url,
                   availability, bio, is_profile_completed, created_at
            FROM users
            WHERE id = %s
        """, (user_id,))
        user = cur.fetchone()

        if not user or not user['is_profile_completed']:
            return jsonify({'error': 'Profile not found'}), 404

        # Projects they own
        cur.execute("""
            SELECT id, title, tech_stack, urgency, is_paid, created_at
            FROM projects
            WHERE owner_id = %s AND is_private = false
            ORDER BY created_at DESC
            LIMIT 6
        """, (user_id,))
        owned = cur.fetchall()

        # Projects they've joined (accepted)
        cur.execute("""
            SELECT p.id, p.title, p.tech_stack, p.urgency, p.is_paid, p.created_at
            FROM projects p
            JOIN project_participants pp ON pp.project_id = p.id
            WHERE pp.user_id = %s AND pp.status = 'accepted' AND p.is_private = false
            ORDER BY pp.joined_at DESC
            LIMIT 6
        """, (user_id,))
        joined = cur.fetchall()

        # Contribution ledger — the credibility system. Every piece of credit
        # this user has received, attested by the owner who defined the problem.
        cur.execute("""
            SELECT c.id, c.problem_statement, c.is_paid, c.stars, c.note, c.created_at,
                   p.id AS project_id, p.title AS project_title,
                   u.user_name AS attested_by_name
            FROM contributions c
            JOIN projects p ON p.id = c.project_id
            JOIN users u ON u.id = c.attested_by
            WHERE c.contributor_id = %s
            ORDER BY c.created_at DESC
        """, (user_id,))
        contributions = cur.fetchall()
        for c in contributions:
            c['created_at'] = c['created_at'].isoformat() if c['created_at'] else None

        # Summary stats for the credibility card
        total_contributions = len(contributions)
        avg_stars = round(sum(c['stars'] for c in contributions) / total_contributions, 1) if total_contributions else None
        paid_count = sum(1 for c in contributions if c['is_paid'])
        paid_pct = round((paid_count / total_contributions) * 100) if total_contributions else None

        def fmt_project(p):
            raw = p['tech_stack'] or ''
            if isinstance(raw, list):
                tech = raw
            else:
                tech = [t.strip() for t in raw.replace('{','').replace('}','').replace('"','').split(',') if t.strip()]
            return {
                'id': p['id'], 'title': p['title'],
                'tech_stack': tech, 'urgency': p['urgency'],
                'is_paid': p['is_paid'],
                'created_at': p['created_at'].isoformat() if p['created_at'] else None,
            }

        result = dict(user)
        result['created_at'] = user['created_at'].isoformat() if user['created_at'] else None
        result['owned_projects'] = [fmt_project(p) for p in owned]
        result['joined_projects'] = [fmt_project(p) for p in joined]
        result['contributions'] = [dict(c) for c in contributions]
        result['credibility'] = {
            'total_contributions': total_contributions,
            'avg_stars': avg_stars,
            'paid_pct': paid_pct,
        }

        return jsonify(result), 200

    except Exception as e:
        print("Error fetching user profile:", e)
        return jsonify({'error': 'Failed to load profile'}), 500
    finally:
        cur.close()
        conn.close()