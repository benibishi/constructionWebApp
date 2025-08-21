import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the index.html file
    file_path = os.path.abspath('index.html')

    # Go to the local HTML file
    page.goto(f'file://{file_path}')

    # Click on the first project card to navigate to the details page
    first_project_card = page.locator(".projects-grid .project-card").first
    expect(first_project_card).to_be_visible()
    first_project_card.click()

    # Click the "Edit Project" button - do not wait for the tab to be visible
    edit_button = page.locator("#editProjectDetailBtn")
    edit_button.click(force=True) # Use force=True to click even if not "visible"

    # Wait for the modal to appear with a longer timeout
    project_modal = page.locator("#projectModal")
    expect(project_modal).to_be_visible(timeout=10000)

    # Change the project name
    new_project_name = "Updated Project Name"
    name_input = project_modal.locator("#projectName")
    name_input.fill(new_project_name)

    # Submit the form
    save_button = project_modal.get_by_text("Save Project")
    save_button.click()

    # Assert that the modal is hidden
    expect(project_modal).to_be_hidden()

    # Assert that the page title has been updated
    page_title = page.locator("#projectDetailTitle") # Look for it anywhere on the page
    expect(page_title).to_have_text(new_project_name)

    # Take a screenshot to visually confirm
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Playwright script for project edit refresh finished and screenshot taken.")
