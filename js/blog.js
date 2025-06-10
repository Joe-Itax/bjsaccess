const BASE_API_URL = "https://bjsaccess-back-office.vercel.app/api";
// const BASE_API_URL = "http://localhost:3000/api";
// Références aux conteneurs HTML
const blogPostsContainer = document.getElementById("blogPostsContainer");
const blogPostsMainContainer = document.getElementById(
  "blogPostsMainContainer"
);
const categoriesList = document.getElementById("categoriesList");
const recentPostsList = document.getElementById("recentPostsList");
const paginationList = document.getElementById("paginationList");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

// Variable pour le debounce de la recherche
let searchTimeout;

// --- Fonctions d'affichage des éléments individuels ---

/**
 * Crée l'élément HTML pour un article de blog.
 * @param {Object} post - L'objet post provenant de l'API.
 * @returns {string} Le HTML de l'article.
 */
function createPostHtml(post) {
  // Formatage de la date (ex: "30 Mai, 2025")
  const date = new Date(post.createdAt);
  const formattedDate = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const imageUrl = post.featuredImage;

  return `
<div
  class="col-md-6 wow slideInUp box-post-card"
  data-wow-delay="0.1s"
>
  <div
    class="blog-item bg-white rounded shadow-sm overflow-hidden position-relative"
    style="transition: box-shadow 0.3s ease-in-out;"
    onmouseover="this.style.boxShadow='0 25px 50px -12px rgba(0, 0, 0, 0.25)'"
    onmouseout="this.style.boxShadow='0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'"
  >
    <div class="position-absolute top-0 start-0 bg-primary text-white mt-5 py-2 px-4" style="z-index: 20;">
      <a class="text-white text-decoration-none" href="/blog.html?category=${
        post.category.slug
      }">
        ${post.category.name}
      </a>
    </div>
    <div class="blog-img position-relative overflow-hidden" style="height: 288px; transition: all 0.3s ease-in-out;">
      <img
        class="img-fluid w-100 h-100"
        style="transition: all 0.3s ease-in-out; object-fit: cover;"
        src="${imageUrl}"
        alt="${post.title}"
        onmouseover="this.style.transform='scale(1.1)'"
        onmouseout="this.style.transform='scale(1)'"
      />
    </div>
    <div class="p-4">
      <div class="d-flex align-items-center text-muted small mb-3">
        <small class="me-3 d-flex align-items-center">
          <i class="far fa-user text-primary me-2"></i>${
            post.author.name || "Admin"
          }
        </small>
        <small class="d-flex align-items-center">
          <i class="far fa-calendar-alt text-primary me-2"></i>${formattedDate}
        </small>
      </div>
      <h4 class="mb-3 " style="color: #343a40; display: -webkit-box!important;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;">${post.title}</h4>
      <div class="text-muted mb-4 box-post-content" style="
        display: -webkit-box!important;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        
      ">${post.content}...</div>

      ${
        post?.tags && post?.tags.length > 0
          ? `
      <div class="d-flex flex-wrap gap-2 mb-4">
        ${post.tags
          .map(
            (tagsOnPost) => `
          <span class="badge rounded-pill px-3 py-1" style="font-size: 0.75em; background: #dbeafe; color: #193cb8;">
            #${tagsOnPost?.tag ? tagsOnPost.tag.name : tagsOnPost.name}
          </span>
        `
          )
          .join("")}
      </div>
      `
          : ""
      }

      <a
        class="text-uppercase text-primary text-decoration-none d-flex align-items-center"
        href="/detail.html?slug=${post.slug}"
      >
        Lire la suite <i class="bi bi-arrow-right ms-2" style="transition: transform 0.3s ease-in-out;"></i>
      </a>
    </div>
  </div>
</div>
`;
}

/**
 * Crée l'élément HTML pour une catégorie.
 * @param {Object} category - L'objet catégorie provenant de l'API.
 * @returns {string} Le HTML de la catégorie.
 */
function createCategoryHtml(category) {
  const publishedPostCount = category.posts
    ? category.posts.filter((post) => post.published).length
    : 0;

  if (publishedPostCount === 0) {
    return ""; // Ne retourne rien si aucun post publié dans cette catégorie
  }
  return `
    <a
      class="h5 fw-semi-bold bg-light rounded py-2 px-3 mb-2"
      href="/blog.html?category=${category.slug}"
      ><i class="bi bi-arrow-right me-2"></i>${category.name} <span class="badge bg-primary float-end">${publishedPostCount}</span></a
    >
  `;
}

/**
 * Crée l'élément HTML pour un post récent.
 * @param {Object} post - L'objet post provenant de l'API.
 * @returns {string} Le HTML du post récent.
 */
function createRecentPostHtml(post) {
  const imageUrl = post.featuredImage;
  return `
  <a
        href="/detail.html?slug=${post.slug}"
        class="h5 fw-semi-bold d-flex align-items-center mb-3 d-flex justify-content-center align-items-center rounded bg-light"
        >
    <div class="d-flex justify-content-between align-items-center" style="width: 100%;">
        <div style="width: 30%; height: 70px!important;">
        <img
        class="img-fluid"
        src="${imageUrl}"
        style="width: 100%; height: 100%; object-fit: cover;"
        alt="${post.title}"
        />
        </div>
        <div style="width: 70%; padding: 5px;">
        <span class="px-1" style="padding: 0px 3px 0px 3px; display: -webkit-box!important; font-size: 1rem; overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;">${post.title}</span>
        </div>
    </div>
    </a>
  `;
}

// --- Fonctions de récupération et d'affichage des données ---
/**
 * Récupère et affiche les articles de blog.
 * @param {number} page - Le numéro de page (par défaut 1).
 * @param {string} searchTerm - Terme de recherche (optionnel).
 * @param {string} categoryFilter - Filtre par catégorie (optionnel).
 */
async function fetchPosts(page = 1, searchTerm = "", categoryFilter = "") {
  if (!blogPostsContainer) return; // S'assurer que l'élément existe

  blogPostsContainer.innerHTML = `<div class="text-center w-100 py-5">Chargement des articles...</div>`; // Indicateur de chargement

  let url = `${BASE_API_URL}/post?page=${page}&limit=5`;
  if (searchTerm.trim()) {
    url += `&search=${encodeURIComponent(searchTerm)}`;
  }
  if (categoryFilter) {
    url += `&category=${encodeURIComponent(categoryFilter)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const posts = data.data || [];
    const totalPages = data.totalPages || 1;

    blogPostsContainer.innerHTML = ""; // Vider le conteneur avant d'ajouter les nouveaux articles

    if (posts.length === 0) {
      blogPostsContainer.innerHTML = `<div class="text-center w-100 py-5">Aucun article trouvé.</div>`;
      setupPagination(1, 1); // Reset pagination
      return;
    }

    posts.forEach((post) => {
      blogPostsContainer.insertAdjacentHTML("beforeend", createPostHtml(post));
    });

    setupPagination(totalPages, page, searchTerm, categoryFilter); // Mise à jour de la pagination
  } catch (error) {
    console.error("Erreur lors de la récupération des articles:", error);
    blogPostsContainer.innerHTML = `<div class="text-center text-danger w-100 py-5">Erreur de chargement des articles. Veuillez réessayer plus tard.</div>`;
    setupPagination(1, 1); // Reset pagination
  }
}

/**
 * Récupère et affiche les catégories.
 */
async function fetchCategories() {
  if (!categoriesList) return;

  categoriesList.innerHTML = `<div class="text-center py-3">Chargement des catégories...</div>`; // Indicateur de chargement

  try {
    const response = await fetch(`${BASE_API_URL}/post/category`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json(); // Assumons que l'API renvoie un tableau de catégories
    const categories = data.data;

    categoriesList.innerHTML = ""; // Vider le conteneur

    const categoriesHtml = categories
      .map((category) => createCategoryHtml(category))
      .join("");

    if (categoriesHtml.trim() === "") {
      // Vérifiez si le HTML généré est vide
      categoriesList.innerHTML = `<div class="text-center py-3">Aucune catégorie disponible avec des articles publiés.</div>`;
    } else {
      categoriesList.insertAdjacentHTML("beforeend", categoriesHtml);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    categoriesList.innerHTML = `<div class="text-center text-danger py-3">Erreur de chargement des catégories.</div>`;
  }
}

/**
 * Récupère et affiche les posts récents.
 */
async function fetchRecentPosts() {
  if (!recentPostsList) return;

  recentPostsList.innerHTML = `<div class="text-center py-3">Chargement des posts récents...</div>`; // Indicateur de chargement

  try {
    const response = await fetch(`${BASE_API_URL}/post?limit=3&sort=desc`); // Exemple: 3 posts les plus récents
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const recentPosts = data.data || [];

    recentPostsList.innerHTML = ""; // Vider le conteneur

    if (recentPosts.length === 0) {
      recentPostsList.innerHTML = `<div class="text-center py-3">Aucun post récent.</div>`;
      return;
    }

    recentPosts.forEach((post) => {
      recentPostsList.insertAdjacentHTML(
        "beforeend",
        createRecentPostHtml(post)
      );
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des posts récents:", error);
    recentPostsList.innerHTML = `<div class="text-center text-danger py-3">Erreur de chargement des posts récents.</div>`;
  }
}

/**
 * Configure la pagination.
 * @param {number} totalPages - Nombre total de pages.
 * @param {number} currentPage - Page actuelle.
 * @param {string} searchTerm - Terme de recherche actuel.
 * @param {string} categoryFilter - Filtre de catégorie actuel.
 */
function setupPagination(
  totalPages,
  currentPage,
  searchTerm = "",
  categoryFilter = ""
) {
  if (!paginationList) return;

  paginationList.innerHTML = ""; // Vider la pagination existante

  // Bouton Précédent
  const prevItem = document.createElement("li");
  prevItem.classList.add("page-item");
  if (currentPage === 1) prevItem.classList.add("disabled");
  prevItem.innerHTML = `<a class="page-link rounded-0" href="#" aria-label="Previous"><span aria-hidden="true"><i class="bi bi-arrow-left"></i></span></a>`;
  prevItem.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      fetchPosts(currentPage - 1, searchTerm, categoryFilter);
      scrollToBlogPostsContainer();
    }
  });
  paginationList.appendChild(prevItem);

  // Numéros de page
  for (let i = 1; i <= totalPages; i++) {
    const pageItem = document.createElement("li");
    pageItem.classList.add("page-item");
    if (i === currentPage) {
      pageItem.classList.add("active");
      pageItem.innerHTML = `<span class="page-link">${i}</span>`; // Non-cliquable pour la page active
    } else {
      pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      pageItem.addEventListener("click", (e) => {
        e.preventDefault();
        fetchPosts(i, searchTerm, categoryFilter);
        scrollToBlogPostsContainer();
      });
    }
    paginationList.appendChild(pageItem);
  }

  // Bouton Suivant
  const nextItem = document.createElement("li");
  nextItem.classList.add("page-item");
  if (currentPage === totalPages) nextItem.classList.add("disabled");
  nextItem.innerHTML = `<a class="page-link rounded-0" href="#" aria-label="Next"><span aria-hidden="true"><i class="bi bi-arrow-right"></i></span></a>`;
  nextItem.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      fetchPosts(currentPage + 1, searchTerm, categoryFilter);
      scrollToBlogPostsContainer();
    }
  });
  paginationList.appendChild(nextItem);
}

/**
 * Fait défiler la page jusqu'au conteneur des articles de blog.
 */
function scrollToBlogPostsContainer() {
  if (blogPostsMainContainer) {
    blogPostsMainContainer.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

// --- Initialisation et gestion des événements ---

document.addEventListener("DOMContentLoaded", () => {
  // Récupérer le filtre de catégorie depuis l'URL si présent
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get("category") || "";
  const initialSearchTerm = urlParams.get("search") || "";

  fetchPosts(1, initialSearchTerm, initialCategory); // Charger les posts au démarrage
  fetchCategories(); // Charger les catégories
  fetchRecentPosts(); // Charger les posts récents

  // Gestion de la recherche
  if (searchInput) {
    searchInput.value = initialSearchTerm; // Set initial search term in input

    // Debounce pour la recherche
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = searchInput.value.trim();
        fetchPosts(1, searchTerm, initialCategory); // Réinitialiser à la première page lors de la recherche
      }, 1000); // Délai de 1 seconde
    });

    // Gestion du clic sur le bouton de recherche (pour compatibilité, bien que l'input gère la recherche debounce)
    if (searchButton) {
      searchButton.addEventListener("click", (e) => {
        e.preventDefault();
        clearTimeout(searchTimeout); // Annuler tout debounce en cours
        const searchTerm = searchInput.value.trim();
        fetchPosts(1, searchTerm, initialCategory);
      });
    }
  }
});
