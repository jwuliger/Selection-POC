// index.js

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.scss";
import "@fortawesome/fontawesome-svg-core/styles.css";

import * as bootstrap from "bootstrap";

import { dom, library } from "@fortawesome/fontawesome-svg-core";

import { faComment } from "@fortawesome/free-solid-svg-icons";

library.add(faComment);
dom.watch();

const initializeTextSelection = async () => {
    const selectionIcon = document.getElementById("selection-icon");
    let popover = null;
    let lastValidSelection = null;

    console.log("initializeTextSelection called");

    const logSelectionState = (label, forceLog = false) => {
        const selection = window.getSelection();
        const selectionState = {
            text: selection.toString(),
            rangeCount: selection.rangeCount,
            isCollapsed: selection.isCollapsed,
        };
        if (forceLog || selectionState.text.trim().length > 0) {
            console.log(`${label} - Selection state:`, selectionState);
        }
    };

    const handleSelection = (event) => {
        console.log("handleSelection triggered by:", event.type);
        logSelectionState("Before handling selection");

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length === 0) {
            console.log("No text selected, skipping processing");
            return;
        }

        if (window.selectionTimeout) {
            console.log("Clearing existing selectionTimeout");
            clearTimeout(window.selectionTimeout);
        }

        window.selectionTimeout = setTimeout(() => {
            console.log("Selection timeout executed");
            logSelectionState("Inside selection timeout");

            lastValidSelection = {
                text: selectedText,
                range: selection.getRangeAt(0).cloneRange(),
            };
            processSelection(lastValidSelection);
        }, 200);
    };

    const processSelection = (selection) => {
        console.log("Processing selection:", selection.text);

        const range = selection.range;
        const rects = range.getClientRects();
        const lastRect = rects[rects.length - 1];

        console.log("Range of selection:", range);
        console.log("Last rectangle of selection:", lastRect);

        // Position the icon at the end of the last line of selected text
        Object.assign(selectionIcon.style, {
            display: "block",
            position: "absolute",
            left: `${lastRect.right}px`,
            top: `${lastRect.bottom}px`,
            transform: "translate(-50%, -50%)",
        });

        console.log(
            "Icon positioned at:",
            selectionIcon.style.left,
            selectionIcon.style.top
        );

        // Dispose of existing popover
        if (popover) {
            console.log("Disposing of existing popover");
            popover.dispose();
        }

        // Create new popover
        popover = new bootstrap.Popover(selectionIcon, {
            content: selection.text,
            trigger: "manual",
            placement: "bottom",
            offset: [0, 10],
            container: "body",
        });

        console.log("New popover created");

        // Apply highlight
        applyHighlight(range);
        console.log("Highlight applied");

        // Store the current selection range for later use
        selectionIcon.dataset.selectionRange = JSON.stringify({
            startContainer: range.startContainer.parentElement.id || "body",
            startOffset: range.startOffset,
            endContainer: range.endContainer.parentElement.id || "body",
            endOffset: range.endOffset,
        });

        console.log(
            "Selection range stored:",
            selectionIcon.dataset.selectionRange
        );
    };

    const applyHighlight = (range) => {
        console.log("Applying highlight to range:", range);
        const highlight = document.createElement("span");
        highlight.className = "highlight";

        // Use a DocumentFragment to hold the highlighted content
        const fragment = document.createDocumentFragment();
        fragment.appendChild(highlight);
        highlight.appendChild(range.extractContents());
        range.insertNode(fragment);

        console.log("Highlight inserted into document");
    };

    const removeHighlights = () => {
        console.log("Removing all highlights");
        document.querySelectorAll(".highlight").forEach((el) => {
            const parent = el.parentNode;
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
        });
        console.log("All highlights removed");
    };

    const handleClickOutside = (event) => {
        const target = event.target;
        const isClickInsidePopover = target.closest(".popover");

        console.log("handleClickOutside triggered");
        console.log("Click target:", target);
        console.log("Is click inside popover?", isClickInsidePopover);
        logSelectionState("Before handleClickOutside action", true);

        if (
            target !== selectionIcon &&
            !selectionIcon.contains(target) &&
            !isClickInsidePopover
        ) {
            console.log(
                "Click detected outside popover and icon, hiding popover and removing highlights"
            );
            if (popover) {
                popover.hide();
            }
            removeHighlights();
            selectionIcon.style.display = "none";
            lastValidSelection = null;
        } else {
            console.log(
                "Click detected inside popover or icon, no action taken"
            );
        }
        logSelectionState("After handleClickOutside action", true);
    };

    selectionIcon.addEventListener("click", (event) => {
        console.log("selectionIcon clicked");
        logSelectionState("Before icon click action", true);
        event.preventDefault();
        event.stopPropagation();

        if (popover) {
            if (popover._isShown()) {
                console.log("Popover is shown, hiding it");
                popover.hide();
            } else {
                console.log("Popover is hidden, showing it");
                if (lastValidSelection) {
                    console.log(
                        "Using lastValidSelection:",
                        lastValidSelection.text
                    );
                    processSelection(lastValidSelection);
                } else {
                    console.log("No valid selection to process");
                }
                popover.show();
            }
        } else {
            console.log("Popover not initialized yet");
        }
        // Removed: logSelectionState("After icon click action", true);
    });

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("click", handleClickOutside, true);

    window.addSelectableText = (element) => {
        console.log("Adding selectable text to element:", element);
        element.classList.add("selectable-text");
        element.style.position = "relative";
    };

    window.removeSelectableText = (element) => {
        console.log("Removing selectable text from element:", element);
        element.classList.remove("selectable-text");
        element.style.position = "";
        removeHighlights();
    };

    document.querySelectorAll(".selectable-text").forEach(addSelectableText);

    console.log("Event listeners and selectable text initialized");

    return () => {
        console.log("Cleaning up event listeners");
        document.removeEventListener("mouseup", handleSelection);
        document.removeEventListener("click", handleClickOutside, true);
    };
};

try {
    const cleanup = await initializeTextSelection();
    console.log("Text selection initialization successful");
} catch (error) {
    console.error("Failed to initialize text selection:", error);
}
