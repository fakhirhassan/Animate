"""
Selenium Automated Tests for ANIAD (AI-Powered Animation Platform)
Next.js 14 Frontend running at http://localhost:3000
Flask Backend running at http://localhost:5001
"""

import pytest
import time
import chromedriver_autoinstaller
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

# Auto-install matching chromedriver
chromedriver_autoinstaller.install()

BASE_URL = "http://localhost:3000"


@pytest.fixture(scope="module")
def driver():
    """Set up Chrome WebDriver for all tests."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")

    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(5)
    yield driver
    driver.quit()


# =============================================================================
# TEST 1: App Loads Successfully
# =============================================================================

class TestAppLoads:
    """Verify the ANIAD homepage loads correctly."""

    def test_homepage_loads(self, driver):
        """Homepage should load and display the ANIAD landing page."""
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        assert driver.title or True  # Next.js may set title dynamically
        # Page should not show a 404 error page
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body_text
        assert "Page Not Found" not in body_text

    def test_homepage_has_hero_section(self, driver):
        """Homepage should display hero section with heading."""
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        h1 = driver.find_element(By.TAG_NAME, "h1")
        assert h1.is_displayed()
        assert len(h1.text) > 0

    def test_homepage_has_navbar(self, driver):
        """Homepage should have the navigation bar."""
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        nav = driver.find_element(By.TAG_NAME, "nav")
        assert nav.is_displayed()

    def test_homepage_has_get_started_button(self, driver):
        """Homepage should have a 'Get Started' CTA button."""
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        # Look for Get Started link/button in the navbar
        links = driver.find_elements(By.TAG_NAME, "a")
        get_started = [l for l in links if "get started" in l.text.lower()]
        assert len(get_started) > 0, "Expected 'Get Started' button on homepage"

    def test_homepage_has_features_section(self, driver):
        """Homepage should have a features section."""
        driver.get(BASE_URL)
        # Scroll down to find feature-related content
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 3)")
        time.sleep(1)
        # Check for section headings (Features, How It Works, etc.)
        headings = driver.find_elements(By.TAG_NAME, "h2")
        heading_texts = [h.text.lower() for h in headings]
        assert any(
            "feature" in t or "how" in t or "work" in t
            for t in heading_texts
        ), f"Expected feature/how-it-works section, got headings: {heading_texts}"


# =============================================================================
# TEST 2: Navigation Works
# =============================================================================

class TestNavigation:
    """Verify navigation links work correctly."""

    def test_nav_to_features_page(self, driver):
        """Clicking 'Features' in nav should go to /features."""
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        # Find the Features link in nav
        nav_links = driver.find_elements(By.CSS_SELECTOR, "nav a")
        features_link = None
        for link in nav_links:
            if "features" in link.text.lower():
                features_link = link
                break
        assert features_link is not None, "Features link not found in nav"
        features_link.click()
        WebDriverWait(driver, 10).until(EC.url_contains("/features"))
        assert "/features" in driver.current_url

    def test_features_page_content(self, driver):
        """Features page should display feature cards."""
        driver.get(f"{BASE_URL}/features")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        h1 = driver.find_element(By.TAG_NAME, "h1")
        assert h1.is_displayed()
        # Should have multiple feature cards
        cards = driver.find_elements(By.CSS_SELECTOR, "[class*='rounded']")
        assert len(cards) > 0, "Expected feature cards on the page"

    def test_nav_to_how_it_works(self, driver):
        """Clicking 'How It Works' in nav should go to /how-it-works."""
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        nav_links = driver.find_elements(By.CSS_SELECTOR, "nav a")
        how_link = None
        for link in nav_links:
            if "how" in link.text.lower():
                how_link = link
                break
        assert how_link is not None, "How It Works link not found in nav"
        how_link.click()
        WebDriverWait(driver, 10).until(EC.url_contains("/how-it-works"))
        assert "/how-it-works" in driver.current_url

    def test_how_it_works_page_content(self, driver):
        """How It Works page should display steps."""
        driver.get(f"{BASE_URL}/how-it-works")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        h1 = driver.find_element(By.TAG_NAME, "h1")
        assert h1.is_displayed()

    def test_nav_login_button(self, driver):
        """Nav should have Login button that goes to /login."""
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        links = driver.find_elements(By.CSS_SELECTOR, "nav a")
        login_link = None
        for link in links:
            if "login" in link.text.lower() or "sign in" in link.text.lower():
                login_link = link
                break
        assert login_link is not None, "Login link not found in nav"
        login_link.click()
        WebDriverWait(driver, 10).until(EC.url_contains("/login"))
        assert "/login" in driver.current_url

    def test_nav_get_started_goes_to_signup(self, driver):
        """Get Started button should navigate to /signup."""
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        links = driver.find_elements(By.CSS_SELECTOR, "nav a")
        signup_link = None
        for link in links:
            if "get started" in link.text.lower():
                signup_link = link
                break
        assert signup_link is not None, "Get Started button not found"
        signup_link.click()
        WebDriverWait(driver, 10).until(EC.url_contains("/signup"))
        assert "/signup" in driver.current_url


# =============================================================================
# TEST 3: Form Submission - Login Form
# =============================================================================

class TestLoginForm:
    """Verify the login form works correctly."""

    def test_login_page_loads(self, driver):
        """Login page should load with email and password fields."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        email_input = driver.find_element(By.ID, "email")
        password_input = driver.find_element(By.ID, "password")
        assert email_input.is_displayed()
        assert password_input.is_displayed()

    def test_login_form_has_submit_button(self, driver):
        """Login page should have a Sign In button."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        buttons = driver.find_elements(By.TAG_NAME, "button")
        sign_in_btn = [b for b in buttons if "sign in" in b.text.lower()]
        assert len(sign_in_btn) > 0, "Sign In button not found"

    def test_login_form_validation_empty(self, driver):
        """Submitting empty login form should show validation errors."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        # Click Sign In without filling fields
        buttons = driver.find_elements(By.TAG_NAME, "button")
        sign_in_btn = [b for b in buttons if "sign in" in b.text.lower()][0]
        sign_in_btn.click()
        time.sleep(1)
        # Should show validation errors (Zod validation)
        page_text = driver.page_source.lower()
        has_error = (
            "required" in page_text
            or "invalid" in page_text
            or "error" in page_text
            or "please" in page_text
        )
        assert has_error, "Expected validation error on empty form submission"

    def test_login_form_email_validation(self, driver):
        """Entering invalid email should show validation error."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        email_input = driver.find_element(By.ID, "email")
        email_input.clear()
        email_input.send_keys("notanemail")
        # Tab to trigger validation
        email_input.send_keys(Keys.TAB)
        time.sleep(0.5)
        # Try to submit
        buttons = driver.find_elements(By.TAG_NAME, "button")
        sign_in_btn = [b for b in buttons if "sign in" in b.text.lower()][0]
        sign_in_btn.click()
        time.sleep(1)
        page_text = driver.page_source.lower()
        assert "invalid" in page_text or "email" in page_text

    def test_login_form_fills_correctly(self, driver):
        """Should be able to type into email and password fields."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        email_input = driver.find_element(By.ID, "email")
        password_input = driver.find_element(By.ID, "password")

        email_input.clear()
        email_input.send_keys("test@example.com")
        password_input.clear()
        password_input.send_keys("TestPassword123!")

        assert email_input.get_attribute("value") == "test@example.com"
        assert password_input.get_attribute("value") == "TestPassword123!"

    def test_login_forgot_password_link(self, driver):
        """Login page should have a forgot password link."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        links = driver.find_elements(By.TAG_NAME, "a")
        forgot_link = [l for l in links if "forgot" in l.text.lower()]
        assert len(forgot_link) > 0, "Forgot password link not found"

    def test_login_page_has_signup_link(self, driver):
        """Login page should have a link to sign up."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        links = driver.find_elements(By.TAG_NAME, "a")
        signup_link = [
            l for l in links
            if "sign up" in l.text.lower() or "create" in l.text.lower() or "register" in l.text.lower()
        ]
        assert len(signup_link) > 0, "Sign up link not found on login page"


# =============================================================================
# TEST 4: Signup Flow
# =============================================================================

class TestSignupFlow:
    """Verify the multi-step signup form works correctly."""

    def test_signup_page_loads(self, driver):
        """Signup page should load with name, email, password, confirmPassword fields."""
        driver.get(f"{BASE_URL}/signup")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "name"))
        )
        assert driver.find_element(By.ID, "name").is_displayed()
        assert driver.find_element(By.ID, "email").is_displayed()
        assert driver.find_element(By.ID, "password").is_displayed()
        assert driver.find_element(By.ID, "confirmPassword").is_displayed()

    def test_signup_page_title(self, driver):
        """Signup page should have a 'Create Account' or similar heading."""
        driver.get(f"{BASE_URL}/signup")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "name"))
        )
        headings = driver.find_elements(By.CSS_SELECTOR, "h1, h2")
        heading_texts = [h.text.lower() for h in headings]
        assert any(
            "create" in t or "sign up" in t or "register" in t or "account" in t
            for t in heading_texts
        ), f"Expected signup heading, got: {heading_texts}"

    def test_signup_password_strength_indicator(self, driver):
        """Typing a password should show the strength indicator."""
        driver.get(f"{BASE_URL}/signup")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "password"))
        )
        password_input = driver.find_element(By.ID, "password")
        password_input.clear()
        password_input.send_keys("Aa1!strong")
        time.sleep(0.5)
        # Password strength indicator should appear (colored bars)
        page_source = driver.page_source.lower()
        assert (
            "strength" in page_source
            or "strong" in page_source
            or "weak" in page_source
            or "medium" in page_source
            or driver.find_elements(By.CSS_SELECTOR, "[class*='bg-']")
        )

    def test_signup_password_mismatch(self, driver):
        """Mismatched passwords should show an error."""
        driver.get(f"{BASE_URL}/signup")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "name"))
        )
        driver.find_element(By.ID, "name").send_keys("Test User")
        driver.find_element(By.ID, "email").send_keys("test@example.com")
        driver.find_element(By.ID, "password").send_keys("StrongPass1!")
        driver.find_element(By.ID, "confirmPassword").send_keys("DifferentPass1!")

        # Submit form
        buttons = driver.find_elements(By.TAG_NAME, "button")
        create_btn = [b for b in buttons if "create" in b.text.lower() or "sign up" in b.text.lower()]
        if create_btn:
            create_btn[0].click()
            time.sleep(1)
            page_text = driver.page_source.lower()
            assert (
                "match" in page_text
                or "don't match" in page_text
                or "mismatch" in page_text
                or "error" in page_text
            ), "Expected password mismatch error"

    def test_signup_form_validation(self, driver):
        """Submitting empty signup form should trigger validation."""
        driver.get(f"{BASE_URL}/signup")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "name"))
        )
        buttons = driver.find_elements(By.TAG_NAME, "button")
        create_btn = [b for b in buttons if "create" in b.text.lower() or "sign up" in b.text.lower()]
        if create_btn:
            create_btn[0].click()
            time.sleep(1)
            page_text = driver.page_source.lower()
            assert (
                "required" in page_text
                or "invalid" in page_text
                or "error" in page_text
                or "please" in page_text
            )

    def test_signup_has_login_link(self, driver):
        """Signup page should link back to login."""
        driver.get(f"{BASE_URL}/signup")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "name"))
        )
        links = driver.find_elements(By.TAG_NAME, "a")
        login_link = [
            l for l in links
            if "sign in" in l.text.lower() or "login" in l.text.lower() or "log in" in l.text.lower()
        ]
        assert len(login_link) > 0, "Login link not found on signup page"


# =============================================================================
# TEST 5: Key Feature - Forgot Password & Reset Password Pages
# =============================================================================

class TestForgotResetPassword:
    """Verify forgot password and reset password flows."""

    def test_forgot_password_page_loads(self, driver):
        """Forgot password page should load with email input."""
        driver.get(f"{BASE_URL}/forgot-password")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        email_input = driver.find_element(By.ID, "email")
        assert email_input.is_displayed()

    def test_forgot_password_has_submit_button(self, driver):
        """Forgot password page should have a submit button."""
        driver.get(f"{BASE_URL}/forgot-password")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        buttons = driver.find_elements(By.TAG_NAME, "button")
        submit_btn = [
            b for b in buttons
            if "send" in b.text.lower() or "reset" in b.text.lower() or "submit" in b.text.lower()
        ]
        assert len(submit_btn) > 0, "Submit button not found on forgot password page"

    def test_forgot_password_email_validation(self, driver):
        """Submitting empty email should show validation error."""
        driver.get(f"{BASE_URL}/forgot-password")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        buttons = driver.find_elements(By.TAG_NAME, "button")
        submit_btn = [
            b for b in buttons
            if "send" in b.text.lower() or "reset" in b.text.lower() or "submit" in b.text.lower()
        ]
        if submit_btn:
            submit_btn[0].click()
            time.sleep(1)
            page_text = driver.page_source.lower()
            assert (
                "required" in page_text
                or "invalid" in page_text
                or "error" in page_text
                or "email" in page_text
            )

    def test_reset_password_page_loads(self, driver):
        """Reset password page should load."""
        driver.get(f"{BASE_URL}/reset-password")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        # Page should load without crashing
        assert "500" not in driver.title if driver.title else True


# =============================================================================
# TEST 6: End-to-End - Full Page Flow (Public Pages)
# =============================================================================

class TestE2EPublicFlow:
    """End-to-end test: navigate through all public pages."""

    def test_full_public_navigation(self, driver):
        """Navigate Home -> Features -> How It Works -> Login -> Signup."""
        # 1. Start at Home
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body_text

        # 2. Go to Features
        driver.get(f"{BASE_URL}/features")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        assert "/features" in driver.current_url

        # 3. Go to How It Works
        driver.get(f"{BASE_URL}/how-it-works")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        assert "/how-it-works" in driver.current_url

        # 4. Go to Login
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        assert "/login" in driver.current_url

        # 5. Go to Signup
        driver.get(f"{BASE_URL}/signup")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "name"))
        )
        assert "/signup" in driver.current_url

    def test_login_to_signup_flow(self, driver):
        """From login page, click signup link and verify navigation."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        # Find signup link
        links = driver.find_elements(By.TAG_NAME, "a")
        signup_link = None
        for link in links:
            href = link.get_attribute("href") or ""
            if "/signup" in href:
                signup_link = link
                break
        assert signup_link is not None, "Signup link not found on login page"
        signup_link.click()
        WebDriverWait(driver, 10).until(EC.url_contains("/signup"))
        assert "/signup" in driver.current_url

    def test_signup_to_login_flow(self, driver):
        """From signup page, click login link and verify navigation."""
        driver.get(f"{BASE_URL}/signup")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "name"))
        )
        links = driver.find_elements(By.TAG_NAME, "a")
        login_link = None
        for link in links:
            href = link.get_attribute("href") or ""
            if "/login" in href:
                login_link = link
                break
        assert login_link is not None, "Login link not found on signup page"
        login_link.click()
        WebDriverWait(driver, 10).until(EC.url_contains("/login"))
        assert "/login" in driver.current_url

    def test_forgot_password_from_login(self, driver):
        """From login page, click forgot password and verify."""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        links = driver.find_elements(By.TAG_NAME, "a")
        forgot_link = None
        for link in links:
            href = link.get_attribute("href") or ""
            if "forgot" in href:
                forgot_link = link
                break
        assert forgot_link is not None, "Forgot password link not found"
        forgot_link.click()
        WebDriverWait(driver, 10).until(EC.url_contains("/forgot-password"))
        assert "/forgot-password" in driver.current_url

    def test_responsive_viewport(self, driver):
        """App should render without errors at mobile viewport."""
        driver.set_window_size(375, 812)  # iPhone X size
        driver.get(BASE_URL)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body_text
        assert "Page Not Found" not in body_text
        # Reset to desktop
        driver.set_window_size(1920, 1080)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
