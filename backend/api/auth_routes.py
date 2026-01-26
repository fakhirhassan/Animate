"""
Authentication API Routes with Supabase Integration
Handles user authentication, registration, and token management.
"""

import logging
from flask import Blueprint, request, jsonify
from supabase_client.supabase_config import get_supabase
from utils.response_formatter import success_response, error_response

# Create blueprint
bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)


@bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint using Supabase Auth.

    Request Body:
        - email: User email
        - password: User password

    Returns:
        JWT token and user info on success
    """
    try:
        data = request.get_json()

        if not data:
            return error_response('No data provided', 400)

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return error_response('Email and password are required', 400)

        # Get Supabase client
        supabase = get_supabase()

        # Authenticate with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        # Get user data from auth response
        user_data = auth_response.user
        session = auth_response.session

        if not user_data or not session:
            return error_response('Invalid email or password', 401)

        # Get additional user info from users table
        user_profile = supabase.table('users').select('*').eq('id', user_data.id).execute()

        if user_profile.data and len(user_profile.data) > 0:
            profile = user_profile.data[0]
        else:
            # If profile doesn't exist in users table, create it
            profile = {
                'id': str(user_data.id),
                'email': user_data.email,
                'name': user_data.user_metadata.get('name', user_data.email.split('@')[0]),
                'role': 'creator'
            }
            # Use upsert to avoid duplicate key errors
            result = supabase.table('users').upsert(profile, on_conflict='id').execute()
            if result.data and len(result.data) > 0:
                profile = result.data[0]

        # Update last_login
        supabase.table('users').update({
            'last_login': 'now()'
        }).eq('id', user_data.id).execute()

        return success_response({
            'user': {
                'id': str(user_data.id),
                'name': profile.get('name'),
                'email': profile.get('email'),
                'role': profile.get('role', 'creator')
            },
            'token': session.access_token,
            'refresh_token': session.refresh_token
        }, 'Login successful')

    except Exception as e:
        logger.error(f'Login error: {str(e)}')
        # Check if it's an auth error
        if 'Invalid login credentials' in str(e):
            return error_response('Invalid email or password', 401)
        return error_response('Login failed. Please try again.', 500)


@bp.route('/signup', methods=['POST'])
def signup():
    """
    User registration endpoint using Supabase Auth.

    Request Body:
        - name: User's full name
        - email: User email
        - password: User password
        - role: User role (optional, defaults to 'creator')

    Returns:
        JWT token and user info on success
    """
    try:
        data = request.get_json()

        if not data:
            return error_response('No data provided', 400)

        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'creator')

        if not all([name, email, password]):
            return error_response('Name, email, and password are required', 400)

        # Validate role
        if role not in ['creator', 'admin']:
            role = 'creator'

        # Get Supabase client
        supabase = get_supabase()

        # Sign up with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "name": name
                }
            }
        })

        user_data = auth_response.user
        session = auth_response.session

        if not user_data:
            return error_response('Signup failed. Email may already be registered.', 400)

        # Create user profile in users table
        user_profile = {
            'id': str(user_data.id),
            'email': email,
            'name': name,
            'role': role
        }

        supabase.table('users').insert(user_profile).execute()

        # If session exists, return tokens (email confirmation disabled)
        if session:
            return success_response({
                'user': {
                    'id': str(user_data.id),
                    'name': name,
                    'email': email,
                    'role': role
                },
                'token': session.access_token,
                'refresh_token': session.refresh_token
            }, 'Registration successful')
        else:
            # Email confirmation required
            return success_response({
                'message': 'Please check your email to confirm your account',
                'user': {
                    'id': str(user_data.id),
                    'email': email
                }
            }, 'Registration successful. Please verify your email.')

    except Exception as e:
        logger.error(f'Signup error: {str(e)}')
        if 'already registered' in str(e).lower() or 'duplicate' in str(e).lower():
            return error_response('Email already registered', 400)
        return error_response('Registration failed. Please try again.', 500)


@bp.route('/logout', methods=['POST'])
def logout():
    """
    User logout endpoint.

    Returns:
        Success message
    """
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

            # Get Supabase client
            supabase = get_supabase()

            # Sign out
            supabase.auth.sign_out()

        return success_response(None, 'Logged out successfully')

    except Exception as e:
        logger.error(f'Logout error: {str(e)}')
        return success_response(None, 'Logged out successfully')


@bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Get current authenticated user info.

    Returns:
        User information
    """
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return error_response('Authorization header required', 401)

        token = auth_header.split(' ')[1]

        # Get Supabase client
        supabase = get_supabase()

        # Get user from token
        user_response = supabase.auth.get_user(token)
        user_data = user_response.user

        if not user_data:
            return error_response('Invalid or expired token', 401)

        # Get user profile
        user_profile = supabase.table('users').select('*').eq('id', user_data.id).execute()

        if user_profile.data and len(user_profile.data) > 0:
            profile = user_profile.data[0]
            return success_response({
                'id': str(user_data.id),
                'name': profile.get('name'),
                'email': profile.get('email'),
                'role': profile.get('role', 'creator')
            })

        return error_response('User profile not found', 404)

    except Exception as e:
        logger.error(f'Get current user error: {str(e)}')
        return error_response('Failed to get user info', 500)


@bp.route('/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh JWT access token.

    Request Body:
        - refresh_token: Refresh token

    Returns:
        New access token
    """
    try:
        data = request.get_json()
        refresh_token_value = data.get('refresh_token')

        if not refresh_token_value:
            return error_response('Refresh token required', 400)

        # Get Supabase client
        supabase = get_supabase()

        # Refresh session
        session_response = supabase.auth.refresh_session(refresh_token_value)
        session = session_response.session

        if not session:
            return error_response('Invalid refresh token', 401)

        return success_response({
            'token': session.access_token,
            'refresh_token': session.refresh_token
        }, 'Token refreshed')

    except Exception as e:
        logger.error(f'Token refresh error: {str(e)}')
        return error_response('Failed to refresh token', 500)


@bp.route('/send-otp', methods=['POST'])
def send_otp():
    """
    Send OTP to user's email for verification.

    Request Body:
        - email: User email
        - name: User's name (optional, for registration)
        - password: User's password (for registration)
        - is_resend: Boolean indicating if this is a resend request

    Returns:
        Success message indicating OTP was sent
    """
    try:
        data = request.get_json()

        if not data:
            return error_response('No data provided', 400)

        email = data.get('email')
        name = data.get('name')
        password = data.get('password')
        is_resend = data.get('is_resend', False)

        if not email:
            return error_response('Email is required', 400)

        # Get Supabase client
        supabase = get_supabase()

        # If this is a resend request or existing user, use magic OTP
        if is_resend:
            # Use Supabase's signInWithOtp to resend OTP
            auth_response = supabase.auth.sign_in_with_otp({
                "email": email,
                "options": {
                    "should_create_user": False  # Don't create new user on resend
                }
            })

            return success_response({
                'email': email,
                'message': 'OTP resent successfully'
            }, f'Verification code sent to {email}')

        # If name and password are provided, this is a new signup request
        if name and password:
            # Use sign_in_with_otp for passwordless OTP flow
            # This sends an OTP email that can be verified
            auth_response = supabase.auth.sign_in_with_otp({
                "email": email,
                "options": {
                    "data": {
                        "name": name,
                        "signup_password": password  # Store password to set later
                    },
                    "should_create_user": True  # Create user if doesn't exist
                }
            })

            return success_response({
                'email': email,
                'message': 'OTP sent successfully'
            }, f'Verification code sent to {email}')
        else:
            # For existing users without password (shouldn't happen in signup flow)
            auth_response = supabase.auth.sign_in_with_otp({
                "email": email
            })

            return success_response({
                'email': email,
                'message': 'OTP sent successfully'
            }, f'Verification code sent to {email}')

    except Exception as e:
        logger.error(f'Send OTP error: {str(e)}')
        error_msg = str(e).lower()
        if 'already registered' in error_msg or 'already exists' in error_msg or 'user already exists' in error_msg:
            # If user exists, send OTP anyway using magic link
            try:
                supabase = get_supabase()
                auth_response = supabase.auth.sign_in_with_otp({
                    "email": email,
                    "options": {
                        "should_create_user": False
                    }
                })
                return success_response({
                    'email': email,
                    'message': 'OTP sent successfully'
                }, f'Verification code sent to {email}')
            except Exception as retry_error:
                logger.error(f'Retry OTP send error: {str(retry_error)}')
                return error_response('Failed to send OTP. Please try again.', 500)
        return error_response('Failed to send OTP. Please try again.', 500)


@bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """
    Verify OTP for email confirmation.

    Request Body:
        - email: User email
        - token: OTP token
        - name: User's name (for new signups)

    Returns:
        JWT token and user info on success
    """
    try:
        data = request.get_json()
        email = data.get('email')
        token = data.get('token')
        name = data.get('name')

        if not all([email, token]):
            return error_response('Email and token are required', 400)

        # Get Supabase client
        supabase = get_supabase()

        # Log the verification attempt
        logger.info(f'Attempting OTP verification for email: {email}, token length: {len(token)}')

        # Verify OTP - use 'email' type for sign_in_with_otp flow
        auth_response = supabase.auth.verify_otp({
            "email": email,
            "token": token,
            "type": "email"
        })

        if not auth_response.session:
            return error_response('Invalid or expired OTP', 400)

        user_data = auth_response.user
        session = auth_response.session

        # If there's a signup password in metadata, update the user's password
        signup_password = user_data.user_metadata.get('signup_password')
        if signup_password:
            try:
                # Update user password using admin API or update user
                supabase.auth.update_user({
                    "password": signup_password
                })
            except Exception as pwd_error:
                logger.warning(f'Failed to set password after OTP verification: {str(pwd_error)}')

        # Check if user profile exists in users table
        user_profile = supabase.table('users').select('*').eq('id', user_data.id).execute()

        if user_profile.data and len(user_profile.data) > 0:
            # Existing user
            profile = user_profile.data[0]
        else:
            # New user - create profile using upsert to avoid duplicate errors
            profile = {
                'id': str(user_data.id),
                'email': email,
                'name': name or user_data.user_metadata.get('name', email.split('@')[0]),
                'role': 'creator'
            }
            result = supabase.table('users').upsert(profile, on_conflict='id').execute()
            if result.data and len(result.data) > 0:
                profile = result.data[0]

        return success_response({
            'user': {
                'id': str(user_data.id),
                'name': profile.get('name'),
                'email': profile.get('email'),
                'role': profile.get('role', 'creator')
            },
            'token': session.access_token,
            'refresh_token': session.refresh_token
        }, 'Email verified successfully')

    except Exception as e:
        logger.error(f'OTP verification error: {str(e)}')
        return error_response('OTP verification failed', 500)


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Send password reset email to user.

    Request Body:
        - email: User email

    Returns:
        Success message indicating reset email was sent
    """
    try:
        data = request.get_json()

        if not data:
            return error_response('No data provided', 400)

        email = data.get('email')

        if not email:
            return error_response('Email is required', 400)

        # Get Supabase client
        supabase = get_supabase()

        # Send password reset email using Supabase Auth
        # This will send an email with a reset link
        supabase.auth.reset_password_for_email(email, {
            'redirect_to': 'http://localhost:3000/reset-password'
        })

        return success_response({
            'email': email,
            'message': 'Password reset email sent'
        }, f'Password reset instructions sent to {email}')

    except Exception as e:
        logger.error(f'Forgot password error: {str(e)}')
        # Don't reveal if email exists or not for security
        return success_response({
            'email': email,
            'message': 'If an account exists with this email, you will receive password reset instructions'
        }, 'Password reset email sent')


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset user password with token from email.

    Request Body:
        - token: Reset token from email
        - password: New password

    Returns:
        Success message
    """
    try:
        data = request.get_json()

        if not data:
            return error_response('No data provided', 400)

        token = data.get('token')
        new_password = data.get('password')

        if not token or not new_password:
            return error_response('Token and new password are required', 400)

        if len(new_password) < 6:
            return error_response('Password must be at least 6 characters', 400)

        # Get Supabase client
        supabase = get_supabase()

        # Set the session with the access token first
        # This authenticates the user with the reset token
        session_response = supabase.auth.set_session(token, token)

        if not session_response.user:
            return error_response('Invalid or expired reset token', 400)

        # Now update the user's password
        auth_response = supabase.auth.update_user({
            "password": new_password
        })

        if not auth_response.user:
            return error_response('Failed to reset password', 400)

        return success_response(None, 'Password reset successfully')

    except Exception as e:
        logger.error(f'Reset password error: {str(e)}')
        if 'Invalid' in str(e) or 'expired' in str(e):
            return error_response('Invalid or expired reset token', 400)
        return error_response('Failed to reset password', 500)
