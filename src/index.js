import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.scss";
import "@fortawesome/fontawesome-svg-core/styles.css"; // Import Font Awesome CSS

import * as bootstrap from "bootstrap";

import { dom, library } from "@fortawesome/fontawesome-svg-core";

import { faComment } from "@fortawesome/free-solid-svg-icons";

// Add the comment icon to the library
library.add(faComment);

// Replace any existing <i> tags with <svg> and set up a MutationObserver to automatically replace any added to the page later
dom.watch();

const initializeTextSelection = async () => {
    const sampleText = document.getElementById("sample-text");
    const selectionIcon = document.getElementById("selection-icon");
    let popover = null;

    const handleSelection = () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length === 0) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const isValidSelection =
            sampleText.contains(range.commonAncestorContainer) ||
            sampleText === range.commonAncestorContainer ||
            range.intersectsNode(sampleText);

        if (!isValidSelection) return;

        const { left, width, bottom } = rect;
        Object.assign(selectionIcon.style, {
            display: "block",
            left: `${left + width / 2 - 15}px`,
            top: `${bottom + window.scrollY + 5}px`,
        });

        popover?.dispose();

        popover = new bootstrap.Popover(selectionIcon, {
            content: selectedText,
            trigger: "click",
            placement: "bottom",
        });

        if (selectedText !== sampleText.textContent.trim()) {
            const span = document.createElement("span");
            span.className = "highlight";
            range.surroundContents(span);
        }
    };

    const handleClickOutside = ({ target }) => {
        if (target !== selectionIcon && !selectionIcon.contains(target)) {
            selectionIcon.style.display = "none";
            popover?.dispose();
            popover = null;

            sampleText.querySelectorAll(".highlight").forEach((highlight) => {
                const parent = highlight.parentNode;
                while (highlight.firstChild) {
                    parent.insertBefore(highlight.firstChild, highlight);
                }
                parent.removeChild(highlight);
            });
        }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup function
    return () => {
        document.removeEventListener("mouseup", handleSelection);
        document.removeEventListener("mousedown", handleClickOutside);
    };
};

// Use top-level await
try {
    const cleanup = await initializeTextSelection();
    // You can use the cleanup function if needed, e.g., when unmounting the component
} catch (error) {
    console.error("Failed to initialize text selection:", error);
}
