(function () {
  const KEY = "theme"; 
  const root = document.documentElement;
  const btn  = document.getElementById("themeToggle");

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const saved = localStorage.getItem(KEY);
  const initial = saved || (prefersDark ? "dark" : "light");

  apply(initial);

  btn && btn.addEventListener("click", () => {
    const cur = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
    apply(cur);
  });

  function apply(theme){
    root.setAttribute("data-bs-theme", theme);
    localStorage.setItem(KEY, theme);
    const i = btn?.querySelector("i");
    if (i){ i.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon"; }
    window.dispatchEvent(new Event("themechange"));
  }
})();