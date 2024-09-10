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

    const handleSelection = (event) => {
        if (window.selectionTimeout) {
            clearTimeout(window.selectionTimeout);
        }

        window.selectionTimeout = setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText.length === 0) return;

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            const selectableElement = event.target.closest(".selectable-text");
            if (!selectableElement) return;

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

            removeHighlights(selectableElement);
            applyHighlight(range, selectableElement);
        }, 200);
    };

    const applyHighlight = (range, container) => {
        const rects = range.getClientRects();
        const containerRect = container.getBoundingClientRect();

        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const highlight = document.createElement("div");
            highlight.className = "highlight";
            highlight.style.position = "absolute";
            highlight.style.left = `${rect.left - containerRect.left}px`;
            highlight.style.top = `${rect.top - containerRect.top}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            highlight.style.pointerEvents = "none";
            container.appendChild(highlight);
        }
    };

    const removeHighlights = (element) => {
        element
            .querySelectorAll(".highlight")
            .forEach((highlight) => highlight.remove());
    };

    const handleClickOutside = ({ target }) => {
        if (window.selectionTimeout) {
            clearTimeout(window.selectionTimeout);
        }

        if (target !== selectionIcon && !selectionIcon.contains(target)) {
            selectionIcon.style.display = "none";
            popover?.dispose();
            popover = null;

            document
                .querySelectorAll(".selectable-text")
                .forEach(removeHighlights);
        }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);

    window.addSelectableText = (element) => {
        element.classList.add("selectable-text");
        element.style.position = "relative";
    };

    window.removeSelectableText = (element) => {
        element.classList.remove("selectable-text");
        element.style.position = "";
        removeHighlights(element);
    };

    document.querySelectorAll(".selectable-text").forEach(addSelectableText);

    return () => {
        document.removeEventListener("mouseup", handleSelection);
        document.removeEventListener("mousedown", handleClickOutside);
    };
};

try {
    const cleanup = await initializeTextSelection();
} catch (error) {
    console.error("Failed to initialize text selection:", error);
}
