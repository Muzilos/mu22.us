(function () {
    // Define your themes here. Create the extra CSS files in your project.
    const themes = [
        { name: "default", href: "style.css" },
        { name: "nocturne", href: "style-nocturne.css" },
        { name: "studio", href: "style-studio.css" },
        { name: "minimal", href: "style-minimal.css" }
    ];


    let currentIndex = 0;
    const stylesheet = document.getElementById("themeStylesheet");

    if (!stylesheet) {
        console.warn("themeStylesheet link element not found.");
        return;
    }

    function applyTheme(index) {
        currentIndex = (index + themes.length) % themes.length; // wrap around
        const theme = themes[currentIndex];

        stylesheet.setAttribute("href", theme.href);
        // Optional: data attribute you can hook into in your CSS if you want
        document.documentElement.setAttribute("data-theme", theme.name);

        console.log("Theme changed to:", theme.name);
    }

    window.addEventListener("keydown", function (event) {
        // Don’t trigger while typing in form fields
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        if (!event.shiftKey) return; // only listen to Shift+key

        const key = event.key.toLowerCase();
        if (key === "z") {
            // Shift+Z → previous theme
            applyTheme(currentIndex - 1);
        } else if (key === "x") {
            // Shift+X → next theme
            applyTheme(currentIndex + 1);
        }
    });

    // Optional: expose manual control in the console, e.g. window.setTheme(1)
    window.setTheme = function (index) {
        applyTheme(index);
    };
})();
