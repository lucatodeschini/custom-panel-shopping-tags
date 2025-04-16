import "https://unpkg.com/wired-card@2.1.0/lib/wired-card.js?module";
import "https://unpkg.com/wired-button@2.1.0/lib/wired-button.js?module";
import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

// Import js-yaml via a CDN; ensure this URL works for your environment.
import jsyaml from "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.mjs";

class ShoppingTagPanel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      narrow: { type: Boolean },
      route: { type: Object },
      panel: { type: Object },
      queryParams: { type: Object },
      categoryItems: { type: Array },
      selectedItems: { type: Array },
      customItems: { type: Array },
      allTags: { type: Array },
      confirmed: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.queryParams = {};
    this.categoryItems = [];
    this.selectedItems = [];
    this.customItems = [];
    this.allTags = [];
    this.confirmed = false;
  }

  static get styles() {
    return css`
      :host {
        background-color: var(--primary-background-color, #fafafa);
        color: var(--primary-text-color, #000000);
        padding: 16px;
        display: block;
        font-family: sans-serif;
      }

      wired-card {
        background-color: var(--card-background-color, #ffffff);
        color: var(--primary-text-color, #000000);
        padding: 16px;
        display: block;
        font-size: 20px; /* Increased font size for better readability */
        max-width: 600px;
        margin: 0 auto;
      }

      /* Container for the select dropdown and "All category" button */
      .controls {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      select {
        padding: 4px 8px;
        font-size: 16px;
      }

      /* Increase the size of the checkboxes */
      input[type="checkbox"] {
        width: 1.5em;
        height: 1.5em;
        margin-right: 8px;
      }

      /* Style for each item display */
      .item-container {
        margin-bottom: 8px;
      }

      /* Custom input container */
      .custom-item-container {
        display: flex;
        align-items: center;
        margin-top: 4px;
        gap: 8px;
      }
      
      .custom-item-container input[type="text"] {
        flex: 1;
      }

      input[type="text"] {
        width: 100%;
        padding: 4px;
        font-size: 16px;
        margin-top: 4px;
        background-color: var(--input-background-color, #ffffff);
        color: var(--primary-text-color, #000000);
        border: 1px solid var(--divider-color, #d1d1d1);
      }

      /* Dark-mode fallback if your environment doesn't override CSS variables */
      @media (prefers-color-scheme: dark) {
        :host {
          background-color: #121212;
          color: #ffffff;
        }
        wired-card {
          background-color: #1e1e1e;
          color: #ffffff;
        }
        input[type="text"] {
          background-color: #666666;
          color: #ffffff;
          border: 1px solid #3c3c3c;
        }
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this._parseQueryParams();
    window.addEventListener("popstate", this._parseQueryParams.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this._parseQueryParams.bind(this));
    super.disconnectedCallback();
  }

  _parseQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    this.queryParams = {
      id: urlParams.get("id"),
      category: urlParams.get("category"),
    };
    this._logToHA(`Parsed queryParams: ${JSON.stringify(this.queryParams)}`);
    this._loadYamlData();
  }

  async _loadYamlData() {
    try {
      // Fetch tags.yaml (adjust the path if needed)
      const response = await fetch("./local/tags.yaml");
      if (!response.ok) {
        this._logToHA(`Failed to fetch tags.yaml: ${response.statusText}`);
        return;
      }
      const yamlText = await response.text();
      const data = jsyaml.load(yamlText);
      if (data && data.tags) {
        this.allTags = data.tags;

        // If a category is selected, load just that category's items
        if (this.queryParams.category) {
          const tagObj = data.tags.find(
            (tag) =>
              tag.name.toLowerCase() ===
              this.queryParams.category.toLowerCase()
          );
          if (tagObj && tagObj.items) {
            this.categoryItems = tagObj.items;
            this._logToHA(
              `Loaded category items for ${this.queryParams.category}`
            );
          } else {
            this._logToHA(
              `No matching tag found in YAML for category: ${this.queryParams.category}`
            );
            this.categoryItems = [];
          }
        } else {
          // No category selected: display items from all categories
          this.categoryItems = data.tags.flatMap((tag) => tag.items);
          this._logToHA("Loaded all items for generic view");
        }
      } else {
        this._logToHA("YAML data does not contain 'tags'.");
      }
    } catch (error) {
      this._logToHA(`Error loading or parsing YAML file: ${error}`);
    }
  }

  _logToHA(message) {
    if (this.hass) {
      this.hass.callService("persistent_notification", "create", {
        message,
        title: "ShoppingTagPanel",
        notification_id: "shopping_tag_panel_log",
      });
    }
    console.log("[ShoppingTagPanel]", message);
  }

  _onCategoryChange(e) {
    const selectedCategory = e.target.value;
    this.queryParams = { ...this.queryParams, category: selectedCategory };
    // Update URL search params
    const url = new URL(window.location);
    if (selectedCategory) {
      url.searchParams.set("category", selectedCategory);
    } else {
      url.searchParams.delete("category");
    }
    window.history.pushState({}, "", url.toString());
    this._loadYamlData();
  }

  _goToAllCategories() {
    this.queryParams.category = null;
    const url = new URL(window.location);
    url.searchParams.delete("category");
    window.history.pushState({}, "", url.toString());
    this._loadYamlData();
  }

  _onCheckboxChange(e) {
    const itemName = e.target.value;
    if (e.target.checked) {
      if (!this.selectedItems.includes(itemName)) {
        this.selectedItems = [...this.selectedItems, itemName];
      }
    } else {
      this.selectedItems = this.selectedItems.filter((i) => i !== itemName);
      this.customItems = this.customItems.filter((i) => i !== itemName);
    }
  }

  _onCustomItemAdd(e) {
    // This event handles adding a custom item when ENTER is pressed.
    if (e.key === "Enter") {
      this._confirmCustomItem();
    }
  }

  _confirmCustomItem() {
    const input = this.shadowRoot.getElementById("customItemInput");
    if (input) {
      const value = input.value.trim();
      if (value && !this.selectedItems.includes(value)) {
        this.customItems = [...this.customItems, value];
        this.selectedItems = [...this.selectedItems, value];
        input.value = "";
      }
    }
  }

  _confirmSelection() {
    if (this.hass) {
      this.hass.callService("script", "add_items_to_shopping_list", {
        items: this.selectedItems,
      });
    }
    this.confirmed = true;
  }

  _goToShoppingList() {
    window.location.href = "/todo?entity_id=todo.shopping_list";
  }

  _goToGenericView() {
    window.location.href = "/shopping-tags";
  }

  render() {
    // If the selection is confirmed, display the confirmation
    if (this.confirmed) {
      return html`
        <wired-card elevation="2">
          <h3>Selection Confirmed</h3>
          <p>Triggered automation for each selected item.</p>
          <wired-button @click="${this._goToShoppingList}">
            Go to Shopping List
          </wired-button>
          <wired-button
            @click="${this._goToGenericView}"
            style="margin-left: 8px;"
          >
            Back to Categories
          </wired-button>
        </wired-card>
      `;
    }

    // Get a sorted list of categories from the YAML tags
    const categories = this.allTags.map((t) => t.name).sort();

    return html`
      <wired-card elevation="2">
        <!-- Category selection controls -->
        <div class="controls">
          <select
            @change="${this._onCategoryChange}"
            .value="${this.queryParams.category || ''}"
          >
            <option value="">-- Select a Category --</option>
            ${categories.map(
              (c) => html`<option value="${c}">${c}</option>`
            )}
          </select>
          <wired-button @click="${this._goToAllCategories}">
            All category
          </wired-button>
        </div>

        <h3>
          ${this.queryParams.category
            ? `Category: ${this.queryParams.category}`
            : "All Categories"}
        </h3>

        <div>
          <h4>Select Items:</h4>
          ${this.categoryItems.length
            ? this.categoryItems.map(
                (item) => html`
                  <div class="item-container">
                    <input
                      type="checkbox"
                      .value="${item.name}"
                      id="item-${item.name}"
                      ?checked="${this.selectedItems.includes(item.name)}"
                      @change="${this._onCheckboxChange}"
                    />
                    <label for="item-${item.name}">
                      ${item.name} ${item.description ? html`- <em>${item.description}</em>` : ''}
                    </label>
                  </div>
                `
              )
            : html`<p>No items found.</p>`}
        </div>

        <div style="margin-top: 16px;">
          <h4>Add Custom Items:</h4>
          <div class="custom-item-container">
            <input
              type="text"
              id="customItemInput"
              placeholder="Type item"
              @keydown="${this._onCustomItemAdd}"
            />
            <wired-button @click="${this._confirmCustomItem}">
              Add
            </wired-button>
          </div>
        </div>

        <div style="margin-top: 16px;">
          <wired-button @click="${this._confirmSelection}">
            Confirm
          </wired-button>
        </div>
        <div style="margin-top: 16px;">
          <strong>Selected Items:</strong>
          <pre>${JSON.stringify(this.selectedItems, null, 2)}</pre>
        </div>
      </wired-card>
    `;
  }
}

customElements.define("shopping-tag-panel", ShoppingTagPanel);
