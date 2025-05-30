const BASE_API_URL = "https://bjsaccess-back-office.vercel.app/api";
// const BASE_API_URL = "http://localhost:3000/api";

// Références aux conteneurs HTML de la page de détail
const blogDetailContainer = document.getElementById("blogDetailContainer");
const loadingMessage = document.getElementById("loadingMessage");
const postImage = document.getElementById("postImage");
const postCategory = document.getElementById("postCategory");
const postTitle = document.getElementById("postTitle");
const postAuthor = document.getElementById("postAuthor");
const postDate = document.getElementById("postDate");
const postContent = document.getElementById("postContent");
const postTagsContainer = document.getElementById("postTagsContainer");

// Comment section elements
const commentCount = document.getElementById("commentCount");
const commentListContainer = document.getElementById("commentListContainer");
const commentForm = document.getElementById("commentForm");
const visitorNameInput = document.getElementById("visitorName");
const visitorEmailInput = document.getElementById("visitorEmail");
const commentContentInput = document.getElementById("commentContent");
const submitCommentButton = document.getElementById("submitCommentButton");

// Sidebar references (re-using from blog.js if possible, or redefine here)
const categoriesList = document.getElementById("categoriesList");
const recentPostsList = document.getElementById("recentPostsList");

// --- Helper Functions (can be shared or duplicated if necessary) ---

/**
 * Crée l'élément HTML pour une catégorie.
 * @param {Object} category - L'objet catégorie provenant de l'API.
 * @returns {string} Le HTML de la catégorie.
 */
function createCategoryHtml(category) {
  return `
    <a
      class="h5 fw-semi-bold bg-light rounded py-2 px-3 mb-2"
      href="/blog.html?category=${category.slug}"
      ><i class="bi bi-arrow-right me-2"></i>${
        category.name
      } <span class="badge bg-primary float-end">${
    category._count.posts || 0
  }</span></a
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

// --- Specific Functions for Detail Page ---

/**
 * Fetches and displays a single blog post.
 * @param {string} postSlug - The slug of the post to fetch.
 */
async function fetchPostDetail(postSlug) {
  if (!blogDetailContainer) return;

  //   blogDetailContainer.innerHTML = `<div class="text-center w-100 py-5">Chargement de l'article...</div>`;
  loadingMessage.innerHTML = `<div class="text-center w-100 py-5">Chargement de l'article...</div>`;

  try {
    const response = await fetch(`${BASE_API_URL}/post/${postSlug}`);
    if (!response.ok) {
      if (response.status === 404) {
        blogDetailContainer.innerHTML = `<div class="text-center w-100 py-5">Article non trouvé.</div>`;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return;
    }
    const data = await response.json();
    const post = data.post;

    // Clear loading message
    // blogDetailContainer.innerHTML = "";
    loadingMessage.innerHTML = "";

    // Populate elements
    if (postImage) postImage.src = post.featuredImage;
    if (postImage) postImage.alt = post.title;
    if (postCategory) postCategory.textContent = post.category.name;
    if (postTitle) postTitle.textContent = post.title;
    if (postAuthor) postAuthor.textContent = post.author?.name || "Admin";

    const date = new Date(post.createdAt);
    const formattedDate = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    if (postDate) postDate.textContent = formattedDate;

    // Use innerHTML for post content as it might contain HTML from a rich text editor
    if (postContent) postContent.innerHTML = post.content;

    // Display tags
    if (postTagsContainer) {
      postTagsContainer.innerHTML = "";
      if (post.tags && post.tags.length > 0) {
        const tagsHtml = post.tags
          .map(
            (tagOnPost) => `
          <span class="badge rounded-pill px-3 py-1 me-2" style="font-size: 0.8em; background: #dbeafe; color: #193cb8;">
            #${tagOnPost?.tag ? tagOnPost.tag.name : tagOnPost.name}
          </span>
        `
          )
          .join("");
        postTagsContainer.insertAdjacentHTML("beforeend", tagsHtml);
      }
    }

    // Now fetch comments for this post
    fetchCommentsForPost(postSlug);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article:", error);
    if (blogDetailContainer) {
      blogDetailContainer.innerHTML = `<div class="text-center text-danger w-100 py-5">Erreur de chargement de l'article. Veuillez réessayer plus tard.</div>`;
    }
  }
}

/**
 * Fetches and displays comments for a specific post.
 * @param {string} postSlug - The slug of the post.
 */
async function fetchCommentsForPost(postSlug) {
  if (!commentListContainer) return;

  commentListContainer.innerHTML = `<div class="text-center py-3">Chargement des commentaires...</div>`;

  try {
    const response = await fetch(`${BASE_API_URL}/post/${postSlug}/comments`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const comments = data.data || [];

    commentListContainer.innerHTML = "";

    if (commentCount)
      commentCount.textContent = `${comments.length} ${
        comments.length >= 2 ? "Commentaires" : "Commentaire"
      }`;

    if (comments.length === 0) {
      commentListContainer.innerHTML = `<div class="text-center py-3">Aucun commentaire pour le moment.</div>`;
      return;
    }

    comments.forEach((comment) => {
      const date = new Date(comment.createdAt);
      const formattedDate = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const formattedContent = comment.content.replace(/\n/g, "<br>");

      const commentHtml = `
        <div class="d-flex mb-4">
          <img
            src="${
              comment.visitorAvatar || "img/user.png"
            }" class="img-fluid rounded"
            style="width: 45px; height: 45px; object-fit: cover;"
            alt="${comment.visitorName}"
          />
          <div class="ps-3">
            <h6>
              <span style="color:rgb(57, 95, 231)">${
                comment.visitorName
              }</span> <small><i>${formattedDate}</i></small>
            </h6>
            <p>${formattedContent}</p>
          </div>
        </div>
      `;
      commentListContainer.insertAdjacentHTML("beforeend", commentHtml);
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    commentListContainer.innerHTML = `<div class="text-center text-danger py-3">Erreur de chargement des commentaires.</div>`;
  }
}

/**
 * Handles the submission of a new comment.
 * @param {string} postSlug - The slug of the post to comment on.
 */
async function handleCommentSubmission(postSlug) {
  if (!commentForm) return;

  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const visitorName = visitorNameInput.value.trim();
    const visitorEmail = visitorEmailInput.value.trim();
    const content = commentContentInput.value.trim();

    if (!visitorName || !visitorEmail || !content) {
      alert("Veuillez remplir tous les champs du commentaire.");
      return;
    }

    submitCommentButton.disabled = true;
    submitCommentButton.textContent = "Publication...";
    submitCommentButton.style.cursor = "notAllowed";

    try {
      const response = await fetch(
        `${BASE_API_URL}/post/${postSlug}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ visitorName, visitorEmail, content }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Comment posted successfully, re-fetch comments to update the list
      await fetchCommentsForPost(postSlug);

      // Clear the form
      commentForm.reset();
      alert("Commentaire ajouté avec succès!");
    } catch (error) {
      console.error("Erreur lors de la publication du commentaire:", error);
      alert(`Erreur lors de l'ajout du commentaire: ${error.message}`);
    } finally {
      submitCommentButton.disabled = false; // Re-enable button
      submitCommentButton.textContent = "Leave Your Comment";
    }
  });
}

/**
 * Récupère et affiche les catégories.
 */
async function fetchCategories() {
  if (!categoriesList) return;

  categoriesList.innerHTML = `<div class="text-center py-3">Chargement des catégories...</div>`;

  try {
    const response = await fetch(`${BASE_API_URL}/post/category`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const categories = data.data;

    categoriesList.innerHTML = "";

    const filteredCategories = categories.filter(
      (category) => category._count.posts > 0
    );

    if (filteredCategories.length === 0) {
      categoriesList.innerHTML = `<div class="text-center py-3">Aucune catégorie disponible.</div>`;
      return;
    }

    filteredCategories.forEach((category) => {
      categoriesList.insertAdjacentHTML(
        "beforeend",
        createCategoryHtml(category)
      );
    });
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

  recentPostsList.innerHTML = `<div class="text-center py-3">Chargement des posts récents...</div>`;

  try {
    const response = await fetch(`${BASE_API_URL}/post?limit=3&sort=desc`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const recentPosts = data.data || [];

    recentPostsList.innerHTML = "";

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

// --- Initialisation ---

document.addEventListener("DOMContentLoaded", () => {
  // Get the postSlug from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const postSlug = urlParams.get("slug");

  if (postSlug) {
    fetchPostDetail(postSlug);
    handleCommentSubmission(postSlug); // Set up comment form listener
  } else {
    if (blogDetailContainer) {
      blogDetailContainer.innerHTML = `<div class="text-center w-100 py-5">Slug de l'article manquant dans l'URL.</div>`;
    }
  }

  // Load sidebar content
  fetchCategories();
  fetchRecentPosts();
});
