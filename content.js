(async function () {
  console.log("LinkedIn Template Extension loaded");

  // Track injection state to prevent duplicates
  let isInjecting = false;
  let currentMessageBox = null;

  // Function to remove all existing dropdowns
  function removeExistingDropdowns() {
    const existingDropdowns = document.querySelectorAll(
      "#linkedin-template-container, #templateDropdown, [data-extension='linkedin-templates']"
    );
    existingDropdowns.forEach(dropdown => {
      dropdown.remove();
      console.log("Removed existing dropdown");
    });
  }

  // Enhanced check for message box with debouncing
  let checkTimeout;
  const debouncedCheck = () => {
    clearTimeout(checkTimeout);
    checkTimeout = setTimeout(checkForMessageBox, 300);
  };

  const observer = new MutationObserver(async (mutations) => {
    // Only process if we're not currently injecting
    if (isInjecting) return;
    
    // Check if there are relevant mutations (message interface changes)
    const hasRelevantMutation = mutations.some(mutation => {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        return addedNodes.some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return node.matches?.('.msg-form, .msg-form__container, .compose-form') ||
                   node.querySelector?.('.msg-form, .msg-form__container, .compose-form');
          }
          return false;
        });
      }
      return false;
    });

    if (hasRelevantMutation) {
      debouncedCheck();
    }
  });

  observer.observe(document.body, { 
    childList: true, 
    subtree: true
  });

  async function checkForMessageBox() {
    if (isInjecting) return;

    const msgBox = document.querySelector(
      "div.msg-form__contenteditable, " +
      "div[contenteditable='true'][role='textbox'], " +
      ".msg-form__msg-content-container div[contenteditable='true'], " +
      ".msg-form__contenteditable, " +
      // New LinkedIn messaging interface selectors
      ".msg-form__msg-content-container--scrollable div[contenteditable='true'], " +
      ".compose-form__message-field div[contenteditable='true'], " +
      "div[data-placeholder='Write a message...']"
    );
    
    // If no message box found, clean up any orphaned dropdowns
    if (!msgBox) {
      removeExistingDropdowns();
      currentMessageBox = null;
      return;
    }

    // If it's the same message box, don't re-inject
    if (msgBox === currentMessageBox) {
      return;
    }

    // Check if dropdown already exists for this message box
    const existingDropdown = document.getElementById("linkedin-template-container");
    if (existingDropdown) {
      // Verify the dropdown is still properly positioned relative to the message box
      const msgContainer = msgBox.closest('.msg-form__container') || 
                          msgBox.closest('.msg-form') || 
                          msgBox.closest('.compose-form');
      
      if (msgContainer && msgContainer.parentNode && 
          msgContainer.parentNode.contains(existingDropdown)) {
        currentMessageBox = msgBox;
        return; // Dropdown exists and is properly positioned
      } else {
        // Dropdown exists but is orphaned, remove it
        existingDropdown.remove();
      }
    }

    console.log("New message box found, injecting dropdown");
    currentMessageBox = msgBox;
    await injectTemplateDropdown(msgBox);
  }

  // Listen for page navigation to clean up dropdowns
  let currentUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      console.log("Page navigation detected, cleaning up");
      currentUrl = window.location.href;
      removeExistingDropdowns();
      currentMessageBox = null;
      // Re-check for message box after navigation
      setTimeout(checkForMessageBox, 2000);
    }
  });
  
  urlObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    console.log("Popstate event detected, cleaning up");
    removeExistingDropdowns();
    currentMessageBox = null;
    setTimeout(checkForMessageBox, 1000);
  });

  // Initial checks with longer delays to avoid race conditions
  setTimeout(checkForMessageBox, 1500);
  setTimeout(checkForMessageBox, 4000);

  async function injectTemplateDropdown(msgBox) {
    try {
      // Set injection flag to prevent concurrent injections
      if (isInjecting) {
        console.log("Already injecting, skipping");
        return;
      }
      
      isInjecting = true;

      // Triple-check that we don't already have a dropdown
      if (document.getElementById("linkedin-template-container")) {
        console.log("Dropdown already exists, skipping injection");
        isInjecting = false;
        return;
      }

      const { templates } = await chrome.storage.sync.get({ templates: [] });
      console.log("Retrieved templates:", templates);

      if (templates.length === 0) {
        console.log("No templates found");
        isInjecting = false;
        return;
      }

      // Find the best container to inject into
      let container = msgBox.closest('.msg-form__container') || 
                     msgBox.closest('.msg-form') || 
                     msgBox.closest('.compose-form') ||
                     msgBox.parentElement;

      if (!container || !container.parentNode) {
        console.error("Could not find suitable container for dropdown");
        isInjecting = false;
        return;
      }

      const templateContainer = document.createElement("div");
      templateContainer.id = "linkedin-template-container";
      templateContainer.setAttribute("data-extension", "linkedin-templates");
      templateContainer.style.cssText = `
        margin: 8px 0;
        padding: 12px;
        background: linear-gradient(135deg, #0077b5 0%, #005885 100%);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,119,181,0.2);
        position: relative;
        z-index: 9999;
      `;

      const label = document.createElement("label");
      label.textContent = "📝 Choose message template: ";
      label.style.cssText = `
        font-size: 13px;
        color: white;
        margin-right: 10px;
        font-weight: 600;
        display: inline-block;
      `;

      const dropdown = document.createElement("select");
      dropdown.id = "templateDropdown";
      dropdown.style.cssText = `
        padding: 6px 12px;
        border: 2px solid #white;
        border-radius: 6px;
        font-size: 14px;
        background: white;
        min-width: 200px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;

      // Add default option
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "🔽 Select a template...";
      dropdown.appendChild(defaultOpt);

      templates.forEach((template, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        const preview = template.length > 40 ? template.substring(0, 40) + "..." : template;
        opt.textContent = `${index + 1}. ${preview}`;
        dropdown.appendChild(opt);
      });

      dropdown.addEventListener("change", async (e) => {
        if (e.target.value === "") return;
        
        const template = templates[e.target.value];
        const name = extractNameFromLinkedIn();
        const company = extractCompanyFromLinkedIn();

        console.log("Extracted name:", name);
        console.log("Extracted company:", company);

        const personalized = template
          .replace(/\{\{name\}\}/gi, name || "there")
          .replace(/\{\{company\}\}/gi, company || "your company");

        console.log("Personalized message:", personalized);
        
        await setNativeValue(msgBox, personalized);
        
        // Reset dropdown with a slight delay
        setTimeout(() => {
          dropdown.value = "";
        }, 500);
      });

      templateContainer.appendChild(label);
      templateContainer.appendChild(dropdown);
      
      // Insert the dropdown before the message container
      container.parentNode.insertBefore(templateContainer, container);
      console.log("Template dropdown injected successfully");
      
      // Add cleanup on navigation
      const cleanupOnNavigation = () => {
        const dropdown = document.getElementById("linkedin-template-container");
        if (dropdown && !document.body.contains(msgBox)) {
          dropdown.remove();
          currentMessageBox = null;
          console.log("Cleaned up dropdown after navigation");
        }
      };
      
      // Listen for navigation changes
      setTimeout(cleanupOnNavigation, 5000);
      
    } catch (error) {
      console.error("Error injecting template dropdown:", error);
    } finally {
      // Always reset the injection flag
      isInjecting = false;
    }
  }

  function extractNameFromLinkedIn() {
    // Try multiple selectors for different LinkedIn layouts
    const selectors = [
      // New message dialog selectors (2024 LinkedIn layout)
      ".artdeco-entity-lockup__title", // Primary selector for name in new message dialog
      ".compose-form .artdeco-entity-lockup__title",
      ".msg-overlay-bubble-header .artdeco-entity-lockup__title",
      ".msg-overlay-conversation-bubble__participant-info h2",
      
      // Legacy selectors
      "h1.text-heading-xlarge",
      "h1.t-24.v-align-middle.break-words",
      ".pv-text-details__left-panel h1",
      ".msg-thread__link-to-profile",
      ".msg-thread__participant-name",
      ".msg-entity-lockup__entity-title",
      "[data-test-id='thread-details-header'] h2",
      
      // Additional fallback selectors
      "[data-view-name='profile-card'] h2",
      ".artdeco-entity-lockup h2"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const fullName = element.textContent.trim();
        const firstName = fullName.split(" ")[0];
        console.log(`Found name using selector ${selector}: ${firstName}`);
        return firstName;
      }
    }

    console.log("Could not extract name from LinkedIn");
    return "";
  }

  function extractCompanyFromLinkedIn() {
    // Try multiple selectors for company information
    const selectors = [
      // New message dialog selectors (2024 LinkedIn layout)
      ".artdeco-entity-lockup__subtitle", // Primary selector for company in new message dialog
      ".compose-form .artdeco-entity-lockup__subtitle",
      ".msg-overlay-bubble-header .artdeco-entity-lockup__subtitle",
      ".msg-overlay-conversation-bubble__participant-info div:nth-child(2)",
      
      // Messaging interface selectors
      ".msg-thread__link-to-profile + div", // Often the subtitle/company is in a div after the name link
      ".msg-thread__participant-company",
      ".msg-entity-lockup__entity-subtitle",
      ".msg-thread__participant-subtitle",
      
      // Profile page selectors  
      ".pv-text-details__left-panel .text-body-medium",
      ".pv-entity__secondary-title",
      "[data-test-id='thread-details-header'] .msg-thread__participant-company",
      
      // General selectors for different layouts
      "h1 + div", // Company info often follows the name
      ".text-body-medium",
      
      // Additional fallback selectors for new layouts
      "[data-view-name='profile-card'] .text-body-medium",
      ".artdeco-entity-lockup .text-body-medium"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        let company = element.textContent.trim();
        console.log(`Found raw text using selector ${selector}: ${company}`);
        
        // Extract company name from common patterns
        company = extractCompanyFromText(company);
        
        if (company) {
          console.log(`Extracted company: ${company}`);
          return company;
        }
      }
    }

    // Enhanced fallback: Look for any text that contains company-like patterns
    console.log("Starting fallback company search...");
    
    // First, try to find elements with company-like patterns in new message dialog
    const companyPatterns = [
      'at Harvard Business School',
      'at Google',
      'at Microsoft', 
      'at Apple',
      'at Amazon',
      'MBA Candidate at',
      'Engineer at',
      'Manager at',
      'Director at'
    ];
    
    const allTextElements = document.querySelectorAll('div, span, p, h1, h2, h3');
    for (const element of allTextElements) {
      const text = element.textContent.trim();
      
      // Skip if text is too short or too long
      if (text.length < 5 || text.length > 200) continue;
      
      console.log("Checking element text:", text);
      
      if (text.includes('@') || text.includes(' at ') || text.includes('|')) {
        const company = extractCompanyFromText(text);
        if (company) {
          console.log(`Found company from fallback search: ${company}`);
          return company;
        }
      }
    }
    
    // Last resort: look for specific patterns in all visible text
    const bodyText = document.body.innerText;
    if (bodyText.includes(' at ')) {
      const lines = bodyText.split('\n');
      for (const line of lines) {
        if ((line.includes(' at ') || line.includes('@')) && line.length < 150) {
          const company = extractCompanyFromText(line.trim());
          if (company) {
            console.log(`Found company from body text search: ${company}`);
            return company;
          }
        }
      }
    }

    console.log("Could not extract company from LinkedIn");
    return "";
  }

  function extractCompanyFromText(text) {
    console.log("Processing text for company extraction:", text);
    
    // Handle complex LinkedIn formats like "MBA Candidate at Harvard Business School | ex-Alphabet, BCG"
    let company = '';
    
    // Pattern 1: "at CompanyName" (most common)
    const atMatch = text.match(/(?:^|\s)at\s+([^|,\n]+?)(?:\s*\||$)/i);
    if (atMatch) {
      company = atMatch[1].trim();
      console.log("Found company using 'at' pattern:", company);
    }
    
    // Pattern 2: "@ CompanyName"
    else {
      const atSymbolMatch = text.match(/(?:^|\s)@\s*([^|,\n]+?)(?:\s*\||$)/i);
      if (atSymbolMatch) {
        company = atSymbolMatch[1].trim();
        console.log("Found company using '@' pattern:", company);
      }
    }
    
    // Pattern 3: Extract from job titles with company names
    if (!company) {
      // Remove common job title prefixes but keep the company part
      const jobTitleMatch = text.match(/^(.*?)\s+(?:at|@)\s+([^|,\n]+?)(?:\s*\||$)/i);
      if (jobTitleMatch) {
        company = jobTitleMatch[2].trim();
        console.log("Found company from job title pattern:", company);
      }
    }
    
    // Pattern 4: If nothing else works, check if the text itself looks like a company
    if (!company && text && !text.includes('LinkedIn') && text.length > 1 && text.length < 100) {
      // Don't use full text that contains job titles
      if (!text.match(/^(CEO|CTO|CFO|VP|Director|Manager|Engineer|Developer|Designer|Founder|President|Senior|Lead|Principal|Head of|Chief|MBA|Student|Candidate)/i)) {
        company = text;
        console.log("Using full text as company fallback:", company);
      }
    }
    
    if (company) {
      // Clean up the company name
      company = company
        .replace(/\s*\([^)]*\)/g, '') // Remove anything in parentheses like "(W25)"
        .replace(/\s*\|.*$/, '') // Remove anything after pipe
        .replace(/\s*-.*$/, '') // Remove anything after dash  
        .replace(/\s*,.*$/, '') // Remove anything after comma
        .replace(/^\s*(and|&)\s*/i, '') // Remove leading "and" or "&"
        .trim();
      
      // Only return if it looks like a reasonable company name
      if (company.length > 1 && company.length < 80 && !company.match(/^\d+$/) && 
          !company.match(/^(he|she|they|his|her|their|the|and|or|but|with|from|for|in|on|at|by)$/i)) {
        console.log("Final extracted company:", company);
        return company;
      }
    }
    
    console.log("No valid company found in text");
    return '';
  }

  async function setNativeValue(element, value) {
    try {
      console.log("Setting value:", value);
      console.log("Target element:", element);
      
      // Method 1: Use document.execCommand for better compatibility
      element.focus();
      element.click();
      
      // Wait for focus to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Select all existing content first
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Use execCommand to insert text (this usually clears placeholders)
      const success = document.execCommand('insertText', false, value);
      console.log("execCommand success:", success);
      
      if (success) {
        // Trigger events after execCommand
        element.dispatchEvent(new InputEvent('input', { 
          bubbles: true, 
          cancelable: true,
          inputType: 'insertText',
          data: value
        }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      
      // Method 2: Manual content setting with aggressive placeholder removal
      setTimeout(async () => {
        console.log("Trying manual content setting...");
        
        // Clear all content
        element.innerHTML = '';
        element.textContent = '';
        
        // Force remove all LinkedIn placeholder classes and attributes
        const placeholderClasses = [
          'msg-form__placeholder',
          'msg-form__contenteditable--empty',
          'placeholder',
          'empty'
        ];
        
        placeholderClasses.forEach(cls => element.classList.remove(cls));
        
        const placeholderAttrs = [
          'data-placeholder',
          'placeholder',
          'aria-placeholder'
        ];
        
        placeholderAttrs.forEach(attr => {
          if (element.hasAttribute(attr)) {
            element.removeAttribute(attr);
          }
        });
        
        // Set content with HTML structure LinkedIn expects
        element.innerHTML = `<p>${value}</p>`;
        
        // Trigger comprehensive events
        const events = [
          new Event('focus', { bubbles: true }),
          new Event('click', { bubbles: true }),
          new Event('input', { bubbles: true }),
          new Event('change', { bubbles: true }),
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
          new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }),
          new InputEvent('input', { 
            bubbles: true, 
            cancelable: true,
            inputType: 'insertText',
            data: value
          })
        ];
        
        for (const event of events) {
          element.dispatchEvent(event);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Force LinkedIn to recognize content by manipulating React state
        const reactKey = Object.keys(element).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
        if (reactKey && element[reactKey]) {
          try {
            const reactInstance = element[reactKey];
            if (reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
              reactInstance.memoizedProps.onChange({ target: element });
            }
          } catch (e) {
            console.log("React state manipulation failed, continuing...");
          }
        }
        
      }, 150);
      
      // Method 3: Character-by-character typing simulation as final fallback
      setTimeout(async () => {
        if (element.innerHTML === '' || element.textContent === '' ||
            element.classList.contains('msg-form__placeholder') ||
            element.hasAttribute('data-placeholder')) {
          
          console.log("Using character-by-character typing simulation...");
          
          // Focus and clear
          element.focus();
          element.innerHTML = '';
          element.textContent = '';
          
          // Remove placeholder indicators
          element.classList.remove('msg-form__placeholder', 'msg-form__contenteditable--empty');
          element.removeAttribute('data-placeholder');
          
          // Type each character with realistic delays
          for (let i = 0; i < value.length; i++) {
            const char = value[i];
            
            // Add character to content
            element.textContent += char;
            
            // Create and dispatch keyboard events
            const keydownEvent = new KeyboardEvent('keydown', {
              key: char,
              code: `Key${char.toUpperCase()}`,
              bubbles: true,
              cancelable: true
            });
            
            const keyupEvent = new KeyboardEvent('keyup', {
              key: char,
              code: `Key${char.toUpperCase()}`,
              bubbles: true,
              cancelable: true
            });
            
            const inputEvent = new InputEvent('input', {
              inputType: 'insertText',
              data: char,
              bubbles: true,
              cancelable: true
            });
            
            element.dispatchEvent(keydownEvent);
            element.dispatchEvent(inputEvent);
            element.dispatchEvent(keyupEvent);
            
            // Small delay between characters
            await new Promise(resolve => setTimeout(resolve, 30));
          }
          
          // Final events
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('blur', { bubbles: true }));
          element.dispatchEvent(new Event('focus', { bubbles: true }));
        }
      }, 400);
      
      // Final verification and cleanup
      setTimeout(() => {
        console.log("Final verification...");
        console.log("Element content:", element.textContent);
        console.log("Element HTML:", element.innerHTML);
        console.log("Element classes:", element.className);
        console.log("Has placeholder attr:", element.hasAttribute('data-placeholder'));
        
        // Last ditch effort - force visible content
        if (!element.textContent || element.textContent.trim() === '') {
          element.innerHTML = value;
          element.style.color = '#000';
          element.style.opacity = '1';
        }
        
      }, 800);
      
      console.log("Message set successfully:", value);
    } catch (error) {
      console.error("Error setting message value:", error);
    }
  }
})();