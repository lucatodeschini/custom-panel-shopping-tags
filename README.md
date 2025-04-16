# HA-Tags Project

This project provides a Python script and a custom panel for Home Assistant to manage shopping tags.

## About Tags

The idea behind this project is to simplify and streamline the process of managing your shopping list. By configuring tags, you can create a structured and categorized list of items that you frequently purchase and are likely to run out of. These tags act as shortcuts to help you quickly identify and add items to your shopping list without having to manually search for them every time.

For example, you can create tags for different categories such as "Bathroom Essentials," "Kitchen Supplies," or "Breakfast Items." Each tag contains a list of items that belong to that category, making it easy to navigate and manage your shopping needs.

This approach not only saves time but also ensures that you never forget to restock essential items. The tags are defined in the `tags.yaml` file, which is processed by the Python script to generate a PDF or other outputs for easy reference.

## Setup Instructions

### Prerequisites
1. Ensure you have Python installed on your system. You can download it from [python.org](https://www.python.org/).
2. Install the required Python dependencies by running:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Python Script
1. Navigate to the project directory

2. Execute the Python script:
   ```bash
   python main.py
   ```
   This script processes the `tags.yaml` file located in the `input/` directory and generates a `shopping_tags.pdf` file in the `output/` directory.

### Custom Panel Setup for Home Assistant
1. Copy the `shopping-tag-panel.js` file to your Home Assistant configuration directory under `www`:
   ```bash
   cp shopping-tag-panel.js /config/www/
   ```
   On Windows, you can manually copy the file to the `/config/www/` directory in your Home Assistant setup.

2. Add the custom panel to your Home Assistant configuration:
   - Open your `configuration.yaml` file in Home Assistant.
   - Add the following lines:
     ```yaml
     panel_custom:
       - name: shopping-tag-panel
         url_path: shopping-tag-panel
         sidebar_title: Shopping Tags
         sidebar_icon: mdi:cart
         module_url: /local/shopping-tag-panel.js
     ```

3. Restart Home Assistant to apply the changes.

## Notes
- Ensure the `www` directory exists in your Home Assistant configuration folder. If it does not exist, create it manually.
- After restarting Home Assistant, the custom panel should appear in the sidebar with the title "Shopping Tags."

## Troubleshooting
- If the custom panel does not appear, check the Home Assistant logs for errors.
- Verify that the `shopping-tag-panel.js` file is accessible at `http://<your-home-assistant-url>/local/shopping-tag-panel.js`.

Enjoy managing your shopping tags with ease!