import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Listen for console events and print them
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    # Get the absolute path to the index.html file
    file_path = os.path.abspath('index.html')

    # Go to the local HTML file
    page.goto(f'file://{file_path}')

    # Click the "Tasks" tab in the navigation
    tasks_nav_link = page.get_by_role("link", name="Tasks")
    tasks_nav_link.click()

    # Ensure the tasks tab is active
    expect(page.locator("#tasks")).to_be_visible()

    # Click the "New Task" button
    new_task_button = page.locator("#addTaskBtn")
    new_task_button.click()

    # Wait for the modal to appear
    task_modal = page.locator("#taskModal")
    expect(task_modal).to_be_visible()

    # The script's main purpose is to trigger the console logs.
    # We can add a small delay to ensure all logs are captured.
    page.wait_for_timeout(1000)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Playwright script for dropdown population finished.")
