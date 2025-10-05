console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.style.borderRadius = '16px';
    button.style.backgroundColor = '#7f01a1';
    button.style.color = '#fff';
    button.style.padding = '0 12px';
    button.style.fontWeight = '500';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s ease';
    button.onmouseover = () => (button.style.backgroundColor = '#9402c0');
    button.onmouseout = () => (button.style.backgroundColor = '#7f01a1');
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

function getEmailContent() {
    const selectors = ['.h7', '.a3s.aiL', '.gmail_quote', '[role="presentation"]'];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) return content.innerText.trim();
    }
    return '';
}

function findComposeToolbar() {
    const selectors = ['.btC', '.aDh', '[role="toolbar"]', '.gU.Up'];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
    }
    return null;
}


function createDropdowns() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '6px';
    container.style.alignItems = 'center';
    container.style.marginRight = '8px';
    container.style.fontFamily = 'Arial, sans-serif';

    const baseSelectStyle = `
        border: 1px solid #dadce0;
        border-radius: 16px;
        padding: 4px 10px;
        font-size: 13px;
        color: #202124;
        background-color: #f8f9fa;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
    `;

    
    const toneSelect = document.createElement('select');
    toneSelect.innerHTML = `
        <option value="professional">Professional</option>
        <option value="friendly">Friendly</option>
        <option value="casual">Casual</option>
        <option value="persuasive">Persuasive</option>
    `;
    toneSelect.style = baseSelectStyle;
    toneSelect.onmouseover = () => (toneSelect.style.backgroundColor = '#fff');
    toneSelect.onmouseout = () => (toneSelect.style.backgroundColor = '#f8f9fa');

    
    const styleSelect = document.createElement('select');
    styleSelect.innerHTML = `
        <option value="short">Short</option>
        <option value="detailed">Detailed</option>
        <option value="formal">Formal</option>
        <option value="informal">Informal</option>
    `;
    styleSelect.style = baseSelectStyle;
    styleSelect.onmouseover = () => (styleSelect.style.backgroundColor = '#fff');
    styleSelect.onmouseout = () => (styleSelect.style.backgroundColor = '#f8f9fa');

    container.appendChild(toneSelect);
    container.appendChild(styleSelect);

    return { container, toneSelect, styleSelect };
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }

    console.log("Toolbar found, creating AI button");
    const button = createAIButton();
    button.classList.add('ai-reply-button');

    const { container, toneSelect, styleSelect } = createDropdowns();
    toolbar.insertBefore(container, toolbar.firstChild);
    toolbar.insertBefore(button, toolbar.firstChild);

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            const tone = toneSelect.value;
            const style = styleSelect.value;

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: tone,
                    style: style
                })
            });

            if (!response.ok) throw new Error('API Request Failed');

            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error('Compose box was not found');
                alert('Compose box not found');
            }
        } catch (error) {
            console.error("Error generating reply:", error);
            alert('Failed to generate reply');
        } finally {
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
    });
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });
