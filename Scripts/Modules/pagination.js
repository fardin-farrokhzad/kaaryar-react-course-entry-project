// pagination.js
export function renderPagination(
  currentPage,
  containerSelector = ".pagination"
) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const pageNumbersContainer = container.querySelector(".page-numbers");
  const prevBtn = container.querySelector(".prev");
  const nextBtn = container.querySelector(".next");

  // Clear previous page numbers
  pageNumbersContainer.innerHTML = "";

  const visiblePages = 7; // number of pages to show at a time

  // Helper to create a page button
  function createPageButton(page, isActive = false) {
    const link = document.createElement("a");
    link.href = `?page=${page}`;
    link.textContent = page;
    link.classList.add("page-btn");
    if (isActive) link.classList.add("active");
    return link;
  }

  // Previous button
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) window.location.href = `?page=${currentPage - 1}`;
  };

  // Next button
  nextBtn.onclick = () => {
    window.location.href = `?page=${currentPage + 1}`;
  };

  // Determine pages to show
  const startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  const pages = [];
  for (let i = startPage; i < startPage + visiblePages; i++) {
    pages.push(i);
  }

  // Render page buttons
  pages.forEach((p) => {
    pageNumbersContainer.appendChild(createPageButton(p, p === currentPage));
  });
}
