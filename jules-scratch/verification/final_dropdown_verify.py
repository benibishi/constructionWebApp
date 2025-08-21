import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Get the absolute path to the index.html file
    file_path = os.path.abspath('index.html')

    # Go to the page and clear localStorage
    page.goto(f'file://{file_path}')
    page.evaluate("localStorage.clear()")
    page.reload()

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

    # Assert the project dropdown has the correct number of options
    project_dropdown = task_modal.locator("#taskProject")
    project_options = project_dropdown.locator("option")
    # There should be 1 "Select" option + 3 sample projects
    expect(project_options).to_have_count(4)

    # Assert the assignee dropdown has the correct number of options
    assignee_dropdown = task_modal.locator("#taskAssignee")
    assignee_options = assignee_dropdown.locator("option")
    # There should be 1 "Unassigned" option + 3 sample team members
    expect(assignee_options).to_have_count(4)

    # Take a screenshot of the modal
    task_modal.screenshot(path="jules-scratch/verification/verification.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Final dropdown verification script finished.")
