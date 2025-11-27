// src/api/xano.js
import axios from "axios";

// ==============================
// BASES
// ==============================
const BASE_URL = "https://x8ki-letl-twmt.n7.xano.io/api:MLGOX1mg";
const ADMIN_STORE_BASE = BASE_URL;

const ADMIN_AUTH_BASE = "https://x8ki-letl-twmt.n7.xano.io/api:IFSIbhTM";
const AUTH_BASE = ADMIN_AUTH_BASE;

console.log("[Auth] AUTH_BASE =>", AUTH_BASE);

// ==============================
// Helpers
// ==============================
const adminAuthHeader = (token) =>
  token ? { Authorization: `Bearer ${token}` } : {};

const mapRoleStringToRoleId = (role) => {
  if (!role) return 2;
  const r = String(role).toLowerCase();
  return r === "admin" ? 1 : 2;
};

// ==============================
// 📦 LISTAR PRODUCTOS (CLIENTE)
// ==============================
export const listProducts = async (
  { token = "", limit = 12, offset = 0, q = "" } = {}
) => {
  try {
    const params = { _limit: limit, _offset: offset };
    if (q) params.q = q;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await axios.get(`${BASE_URL}/product`, { params, headers });
    return res.data;
  } catch (err) {
    console.error("❌ Error al listar productos:", err);
    throw err;
  }
};

// ==============================
// 🖼️ SUBIR IMAGEN
// ==============================
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await axios.post(`${BASE_URL}/upload/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return Array.isArray(res.data) ? res.data : [res.data];
  } catch (err) {
    console.error("❌ Error al subir imagen:", err);
    throw err;
  }
};

// ==============================
// 🆕 CREAR PRODUCTO
// ==============================
export const createProduct = async (productData) => {
  try {
    const cleanData = {
      name: productData.name,
      price: parseFloat(productData.price) || 0,
      stock: parseInt(productData.stock, 10) || 0,
      descripcion: productData.descripcion || "",
      genero: productData.genero || "",
      image: Array.isArray(productData.image) ? productData.image : [],
    };

    const res = await axios.post(`${BASE_URL}/product`, cleanData, {
      headers: { "Content-Type": "application/json" },
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    throw err;
  }
};

// ==============================
// 🟠 CLIENTE – CREAR ORDEN
// ==============================
export async function createOrder({
  token,
  user_id,
  user_email,
  items,
  total,
  cardNumber,
}) {
  try {
    const products_bought = (items || []).map((it) => ({
      product_id: it.product_id ?? it.id,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
    }));

    const payload = {
      user_id,
      user_email,
      total,
      status: "pendiente",
      products_bought,
      card_number: cardNumber,
    };

    const res = await axios.post(`${BASE_URL}/order`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (err) {
    console.error("❌ [createOrder] Error:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 💾 MÉTODO DE PAGO
// ==============================
export async function savePaymentMethod({
  token,
  user_id,
  last4,
  brand = "unknown",
  masked = "",
}) {
  try {
    const payload = { user_id, last4, brand, masked };

    const res = await axios.post(`${BASE_URL}/payment_method`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error savePaymentMethod:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 📦 ADMIN – PRODUCTOS
// ==============================
export async function adminListProducts(token) {
  try {
    const res = await axios.get(`${ADMIN_STORE_BASE}/product`, {
      params: { _limit: 200 },
      headers: adminAuthHeader(token),
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error adminListProducts:", err);
    throw err;
  }
}

export async function adminDeleteProduct(id, token) {
  try {
    await axios.delete(`${ADMIN_STORE_BASE}/product/${id}`, {
      headers: adminAuthHeader(token),
    });
  } catch (err) {
    console.error("❌ Error adminDeleteProduct:", err);
    throw err;
  }
}

export async function adminUpdateProduct(id, productData, token) {
  try {
    const payload = {};
    if (productData.name !== undefined) payload.name = productData.name;
    if (productData.price !== undefined)
      payload.price = parseFloat(productData.price) || 0;
    if (productData.stock !== undefined)
      payload.stock = parseInt(productData.stock, 10) || 0;
    if (productData.descripcion !== undefined)
      payload.descripcion = productData.descripcion;
    if (productData.genero !== undefined) payload.genero = productData.genero;
    if (productData.image !== undefined)
      payload.image = Array.isArray(productData.image)
        ? productData.image
        : productData.image || [];

    const res = await axios.patch(
      `${ADMIN_STORE_BASE}/product/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeader(token),
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("❌ Error adminUpdateProduct:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 👥 ADMIN – USUARIOS
// ==============================
export async function adminListUsers(token) {
  try {
    const res = await axios.get(`${ADMIN_AUTH_BASE}/user`, {
      headers: adminAuthHeader(token),
    });

    return (res.data || []).map((u) => {
      let roleString = "cliente";

      if (typeof u.role === "string") {
        roleString = u.role.toLowerCase();
      } else if (u.role_id && typeof u.role_id === "object") {
        const name =
          u.role_id.name || u.role_id.title || u.role_id.rol || u.role_id.role;
        roleString = String(name).toLowerCase().includes("admin")
          ? "admin"
          : "cliente";
      } else if (typeof u.role_id === "number") {
        roleString = u.role_id === 1 ? "admin" : "cliente";
      }

      return { ...u, role: roleString, blocked: Boolean(u.blocked) };
    });
  } catch (err) {
    console.error("❌ Error adminListUsers:", err.response?.data || err);
    throw err;
  }
}

/**
 * Bloquear / desbloquear usuario SIN borrar datos.
 * 1. Trae el usuario de Xano.
 * 2. Manda todos los campos que espera el endpoint + blocked.
 */
// 👥 ADMIN – BLOQUEAR / DESBLOQUEAR USUARIO (sin GET extra)
export async function adminSetUserBlocked(user, blocked, token) {
  try {
    // calcular rol en formato numérico que espera Xano
    let roleValue = 2;

    if (typeof user.role === "number") {
      roleValue = user.role;
    } else if (typeof user.role_id === "number") {
      roleValue = user.role_id;
    } else if (user.role_id && typeof user.role_id === "object") {
      const name =
        user.role_id.name ||
        user.role_id.title ||
        user.role_id.rol ||
        user.role_id.role;
      roleValue = mapRoleStringToRoleId(name);
    } else if (typeof user.role === "string") {
      roleValue = mapRoleStringToRoleId(user.role);
    }

    // payload completo para que Xano no pise campos con null
    const payload = {
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      shipping_address: user.shipping_address || "",
      role: roleValue,          // 👈 en Xano el input se llama "role"
      blocked: Boolean(blocked) // 👈 nuevo estado
    };

    const res = await axios.patch(
      `${ADMIN_AUTH_BASE}/user/${user.id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeader(token),
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("❌ Error adminSetUserBlocked:", err.response?.data || err);
    throw err;
  }
}


export async function adminDeleteUser(id, token) {
  try {
    await axios.delete(`${ADMIN_AUTH_BASE}/user/${id}`, {
      headers: adminAuthHeader(token),
    });
  } catch (err) {
    console.error("❌ Error adminDeleteUser:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 👤 ADMIN – CREAR USUARIO
// ==============================
export async function adminCreateUser(userData, token) {
  try {
    const payload = {
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      phone: userData.phone || "",
      shipping_address: userData.shipping_address || "",
      role_id: mapRoleStringToRoleId(userData.role),
      blocked: false,
    };

    const res = await axios.post(`${AUTH_BASE}/auth/signup`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...adminAuthHeader(token),
      },
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error adminCreateUser:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 👤 ADMIN – ACTUALIZAR USUARIO
// ==============================
export async function adminUpdateUser(id, userData, token) {
  try {
    const payload = {};

    // helper para evitar mandar strings vacíos
    const setIfNonEmpty = (key, value) => {
      if (value === undefined || value === null) return;

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") return;
        payload[key] = trimmed;
      } else {
        payload[key] = value;
      }
    };

    // Campos de texto
    setIfNonEmpty("email", userData.email);
    setIfNonEmpty("first_name", userData.first_name);
    setIfNonEmpty("last_name", userData.last_name);
    setIfNonEmpty("phone", userData.phone);
    setIfNonEmpty("shipping_address", userData.shipping_address);

    // password solo si viene algo
    if (
      typeof userData.password === "string" &&
      userData.password.trim() !== ""
    ) {
      payload.password = userData.password.trim();
    }

    // role → el endpoint espera "role" (integer)
    if (
      userData.role !== undefined &&
      userData.role !== null &&
      String(userData.role).trim() !== ""
    ) {
      payload.role = mapRoleStringToRoleId(userData.role);
    }

    // si no hay cambios, no pegamos al endpoint
    if (Object.keys(payload).length === 0) {
      console.warn("⚠️ adminUpdateUser: no hay cambios para enviar");
      return;
    }

    const res = await axios.patch(`${ADMIN_AUTH_BASE}/user/${id}`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...adminAuthHeader(token),
      },
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error adminUpdateUser:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 💳 ADMIN – ÓRDENES
// ==============================
export async function adminListOrders(token, status = "") {
  try {
    const params = status ? { status } : {};

    const res = await axios.get(`${ADMIN_STORE_BASE}/order`, {
      params,
      headers: adminAuthHeader(token),
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error adminListOrders:", err);
    throw err;
  }
}

export async function adminUpdateOrderStatus(id, status, token) {
  try {
    const res = await axios.patch(
      `${ADMIN_STORE_BASE}/order/${id}`,
      { status },
      {
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeader(token),
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      "❌ Error adminUpdateOrderStatus:",
      err.response?.data || err
    );
    throw err;
  }
}

// ==============================
// 📦 ACTUALIZAR STOCK
// ==============================
export async function updateProductStock(productId, newStock, token) {
  try {
    const res = await axios.patch(
      `${ADMIN_STORE_BASE}/product/${productId}`,
      { stock: newStock },
      {
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeader(token),
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("❌ Error updateProductStock:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 🔄 CONFIRMAR ORDEN
// ==============================
export async function confirmOrder(orderId, token, adminId) {
  try {
    const orderRes = await axios.get(`${ADMIN_STORE_BASE}/order/${orderId}`, {
      headers: adminAuthHeader(token),
    });
    const order = orderRes.data;
    const items = order.products_bought || [];

    const products = await adminListProducts(token);

    for (const item of items) {
      const productId = item.product_id;
      const quantity = Number(item.quantity || 0);

      const product = products.find((p) => p.id === productId);
      if (!product) {
        console.warn(`⚠️ Producto ${productId} no encontrado`);
        continue;
      }

      const currentStock = Number(product.stock || 0);
      const newStock = Math.max(0, currentStock - quantity);
      await updateProductStock(productId, newStock, token);
    }

    const updateRes = await axios.patch(
      `${ADMIN_STORE_BASE}/order/${orderId}`,
      {
        status: "enviado",
        confirmed_by: adminId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeader(token),
        },
      }
    );

    return updateRes.data;
  } catch (err) {
    console.error("❌ Error confirmOrder:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// ❌ RECHAZAR ORDEN
// ==============================
export async function rejectOrder(orderId, token) {
  try {
    const orderRes = await axios.get(`${ADMIN_STORE_BASE}/order/${orderId}`, {
      headers: adminAuthHeader(token),
    });
    const order = orderRes.data;
    const items = order.products_bought || [];

    const products = await adminListProducts(token);

    for (const item of items) {
      const productId = item.product_id;
      const quantity = Number(item.quantity || 0);

      const product = products.find((p) => p.id === productId);
      if (!product) {
        console.warn(`⚠️ Producto ${productId} no encontrado`);
        continue;
      }

      const currentStock = Number(product.stock || 0);
      const newStock = currentStock + quantity;
      await updateProductStock(productId, newStock, token);
    }

    const updateRes = await axios.patch(
      `${ADMIN_STORE_BASE}/order/${orderId}`,
      { status: "cancelado" },
      {
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeader(token),
        },
      }
    );

    return updateRes.data;
  } catch (err) {
    console.error("❌ Error rejectOrder:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 📰 BLOG – CLIENTE
// ==============================
export async function listBlogPosts() {
  try {
    const res = await axios.get(`${BASE_URL}/blog_post`, {
      params: {
        _limit: 50,
        _order: "created_at",
        _order_direction: "desc",
      },
    });

    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("❌ Error listBlogPosts:", err.response?.data || err);
    throw err;
  }
}

export async function getBlogPost(id) {
  try {
    const res = await axios.get(`${BASE_URL}/blog_post/${id}`);
    return res.data;
  } catch (err) {
    console.error("❌ Error getBlogPost:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 📰 BLOG – ADMIN
// ==============================
export async function adminListBlogPosts(token) {
  try {
    const res = await axios.get(`${BASE_URL}/blog_post_all`, {
      headers: adminAuthHeader(token),
    });

    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("❌ Error adminListBlogPosts:", err.response?.data || err);
    throw err;
  }
}

export async function adminCreateBlogPost(data) {
  try {
    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "");

    const payload = {
      title: data.title,
      slug,
      section: data.section || "news",
      tag: data.tag || "",
      excerpt: data.excerpt || "",
      body: data.body || "",
      published: data.published ?? true,
      cover_image: data.cover_image || null,
      gallery: Array.isArray(data.gallery) ? data.gallery : [],
    };

    const res = await axios.post(`${BASE_URL}/blog_post`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error adminCreateBlogPost:", err.response?.data || err);
    throw err;
  }
}

// ==============================
// 📝 BLOG – ACTUALIZAR POST
// ==============================
export async function adminUpdateBlogPost(id, token, data) {
  try {
    const slug =
      data.slug ||
      (data.title
        ? data.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\-]/g, "")
        : undefined);

    const payload = {
      title: data.title,
      section: data.section || "news",
      tag: data.tag || "",
      excerpt: data.excerpt || "",
      body: data.body || "",
      published: data.published ?? true,
      cover_image: data.cover_image || null,
      gallery: Array.isArray(data.gallery) ? data.gallery : [],
    };

    if (slug) payload.slug = slug;

    const res = await axios.patch(`${BASE_URL}/blog_post/${id}`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...adminAuthHeader(token),
      },
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error adminUpdateBlogPost STATUS:", err.response?.status);
    console.error("❌ Error adminUpdateBlogPost DATA:", err.response?.data);
    throw err;
  }
}

export async function adminDeleteBlogPost(id, token) {
  try {
    await axios.delete(`${BASE_URL}/blog_post/${id}`, {
      headers: adminAuthHeader(token),
    });
  } catch (err) {
    console.error("❌ Error adminDeleteBlogPost:", err.response?.data || err);
    throw err;
  }
}

export async function toggleBlogPostPublished(id, published) {
  try {
    const res = await axios.patch(
      `${BASE_URL}/blog_post/${id}`,
      { published },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      "❌ Error toggleBlogPostPublished:",
      err.response?.data || err
    );
    throw err;
  }
}
