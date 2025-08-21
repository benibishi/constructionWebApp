import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

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

    # Assert the project dropdown has the correct options
    project_dropdown = task_modal.locator("#taskProject")
    expect(project_dropdown).to_contain_text("Select Project")
    expect(project_dropdown).to_contain_text("Downtown Office Complex")
    expect(project_dropdown).to_contain_text("Residential Housing Development")
    expect(project_dropdown).to_contain_text("Highway Infrastructure Upgrade")
    expect(project_dropdown).to_contain_text("Building 5 livingston north")
    expect(project_dropdown).to_contain_text("ertwert")


    # Assert the assignee dropdown has the correct options
    assignee_dropdown = task_modal.locator("#taskAssignee")
    expect(assignee_dropdown).to_contain_text("Unassigned")
    expect(assignee_dropdown).to_contain_text("John Smith")
    expect(assignee_dropdown).to_contain_text("Maria Garcia")
    expect(assignee_dropdown).to_contain_text("David Johnson")

    # Take a screenshot of the modal
    task_modal.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Playwright script for dropdown content verification finished.")
