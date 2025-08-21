import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Create a new browser context with no storage state
    context = browser.new_context(storage_state=None)
    page = context.new_page()

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

    # Check the debug info div
    debug_info = page.locator("#debug-info")
    expect(debug_info).to_have_text("Projects: 3, Team: 3")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Playwright script for debug info verification finished.")
