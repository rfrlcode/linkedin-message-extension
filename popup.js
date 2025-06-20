document.getElementById("saveBtn").addEventListener("click", async () => {
  const templateInput = document.getElementById("templateInput");
  const template = templateInput.value.trim();
  
  if (!template) {
    alert("Please enter a template message");
    return;
  }
  
  try {
    let { templates } = await chrome.storage.sync.get({ templates: [] });
    templates.push(template);
    await chrome.storage.sync.set({ templates });
    
    // Clear input and refresh display
    templateInput.value = "";
    displayTemplates();
    
    console.log("Template saved successfully");
  } catch (error) {
    console.error("Error saving template:", error);
    alert("Error saving template. Please try again.");
  }
});

async function displayTemplates() {
  try {
    let { templates } = await chrome.storage.sync.get({ templates: [] });
    const list = document.getElementById("templates");
    const emptyState = document.getElementById("emptyState");
    
    list.innerHTML = "";
    
    if (templates.length === 0) {
      emptyState.style.display = "block";
      return;
    }
    
    emptyState.style.display = "none";
    
    templates.forEach((template, index) => {
      const li = document.createElement("li");
      
      const templateText = document.createElement("div");
      templateText.className = "template-text";
      templateText.textContent = template;
      
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "×";
      deleteBtn.title = "Delete template";
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this template?")) {
          await deleteTemplate(index);
        }
      });
      
      li.appendChild(templateText);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error displaying templates:", error);
  }
}

async function deleteTemplate(index) {
  try {
    let { templates } = await chrome.storage.sync.get({ templates: [] });
    templates.splice(index, 1);
    await chrome.storage.sync.set({ templates });
    displayTemplates();
    console.log("Template deleted successfully");
  } catch (error) {
    console.error("Error deleting template:", error);
    alert("Error deleting template. Please try again.");
  }
}

// Allow Enter key to save template
document.getElementById("templateInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    document.getElementById("saveBtn").click();
  }
});

// Initial display
displayTemplates();