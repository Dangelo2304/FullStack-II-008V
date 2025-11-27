// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

// ===============================
// 🔗 CONFIGURACIÓN BASE
// ===============================

// Validamos la variable de entorno. Si está mal, usamos la URL buena de Xano.
const AUTH_BASE = (() => {
  const envUrl = import.meta.env.VITE_XANO_AUTH_BASE;

  if (typeof envUrl === "string") {
    const trimmed = envUrl.trim();

    // Debe empezar con http(s) y contener "xano.io"
    if (trimmed.startsWith("http") && trimmed.includes("xano.io")) {
      return trimmed;
    }
  }

  // Fallback seguro
  return "https://x8ki-letl-twmt.n7.xano.io/api:IFSIbhTM";
})();

console.log("[Auth] AUTH_BASE =>", AUTH_BASE);

const TOKEN_TTL_SEC = Number(
  import.meta.env.VITE_XANO_TOKEN_TTL_SEC || "86400"
);

// ===============================
// 🧠 CONTEXTO
// ===============================
const AuthContext = createContext(null);

function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Normaliza el usuario que viene de Xano para
 * que SIEMPRE tenga un campo `role` de texto.
 *
 * Mapeo:
 *   role_id = 1 -> "admin"
 *   role_id = 2 -> "cliente"
 */
function normalizeUser(raw) {
  if (!raw) return null;

  // Nunca guardamos el hash de la contraseña en el front
  const { password, ...rest } = raw;

  let roleName = "";

  // Si algún día tienes role como texto u objeto:
  if (typeof raw.role === "string") {
    roleName = raw.role.toLowerCase();
  } else if (raw.role && typeof raw.role.name === "string") {
    roleName = raw.role.name.toLowerCase();
  } else if (typeof raw.role_name === "string") {
    roleName = raw.role_name.toLowerCase();
  }

  // Si no vino rol en texto, usamos role_id
  if (!roleName && raw.role_id != null) {
    const id = Number(raw.role_id);
    if (id === 1) roleName = "admin";
    else if (id === 2) roleName = "cliente";
    else roleName = "cliente";
  }

  return {
    ...rest,
    role: roleName,
  };
}

// ===============================
// ⚙️ PROVEEDOR PRINCIPAL
// ===============================
export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("auth_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    try {
      return normalizeUser(JSON.parse(raw));
    } catch {
      return null;
    }
  });
  const [expiresAt, setExpiresAt] = useState(
    Number(localStorage.getItem("auth_exp")) || null
  );

  const makeAuthHeader = (t) => ({ Authorization: `Bearer ${t}` });

  // ===============================
  // 💾 SINCRONIZAR TOKEN / EXPIRACIÓN
  // ===============================
  useEffect(() => {
    if (!token) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_exp");
      return;
    }

    localStorage.setItem("auth_token", token);

    const payload = decodeJwt(token);
    const exp = payload?.exp
      ? payload.exp * 1000
      : Date.now() + TOKEN_TTL_SEC * 1000;

    setExpiresAt(exp);
    localStorage.setItem("auth_exp", String(exp));
  }, [token]);

  // Guardar usuario en localStorage
  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  // ===============================
  // 👤 OBTENER USUARIO DESDE /auth/me (backup)
  // ===============================
  async function fetchCurrentUser(currentToken) {
    const t = currentToken || token;
    if (!t) return null;

    try {
      const { data } = await axios.get(`${AUTH_BASE}/auth/me`, {
        headers: makeAuthHeader(t),
      });

      const normalized = normalizeUser(data);
      setUser(normalized);
      return normalized;
    } catch (err) {
      console.error("Error en /auth/me:", err);
      // No rompemos el flujo, simplemente devolvemos null
      return null;
    }
  }

  // Al montar: si hay token pero user vacío o sin rol → intentamos rellenar
  useEffect(() => {
    if (token && (!user || !user.role)) {
      fetchCurrentUser(token).catch((err) => {
        console.error("Error al refrescar usuario en montaje:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ===============================
  // 🔐 FUNCIONES DE AUTENTICACIÓN
  // ===============================

  // --- LOGIN ---
  async function loginAxios({ email, password }) {
    try {
      console.log("🔐 Haciendo login contra:", `${AUTH_BASE}/auth/login`, {
        email,
      });

      const res = await axios.post(`${AUTH_BASE}/auth/login`, {
        email,
        password,
      });

      console.log("✅ Respuesta login:", res.data);

      const data = res.data;

      // 1) Token que viene de Xano
      const newToken = data.authToken || data.token || data.jwt;
      if (!newToken) {
        throw new Error("El servidor no devolvió un token de autenticicación.");
      }

      // 2) Usuario que viene del login (Xano ahora lo manda como `user`)
      const rawUser = data.user || null;

      // 3) Si vino usuario y está bloqueado → NO dejamos entrar
      if (rawUser?.blocked) {
        // Limpiamos cualquier rastro de sesión
        setToken("");
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_exp");

        throw new Error(
          "Tu cuenta ha sido suspendida. Comunícate con el administrador."
        );
      }

      // 4) Guardar token
      setToken(newToken);

      // 5) Guardar usuario normalizado
      let newUser = null;

      if (rawUser) {
        newUser = normalizeUser(rawUser);
        setUser(newUser);
        console.log("👤 Usuario guardado en contexto:", newUser);
      } else {
        // Fallback: si por alguna razón no vino user en la respuesta
        newUser = await fetchCurrentUser(newToken);
      }

      // Si después de todo esto seguimos sin usuario, NO consideramos login válido
      if (!newUser) {
        throw new Error(
          "No se pudo obtener la información de tu cuenta. Intenta nuevamente."
        );
      }

      return { token: newToken, user: newUser };
    } catch (err) {
      console.error("❌ Error crudo en login:", err);

      if (err?.response) {
        console.error(
          "📥 Respuesta del servidor:",
          err.response.status,
          err.response.data
        );
      }

      throw new Error(
        err?.response?.data?.message ||
        err.message ||
        "Credenciales inválidas o error del servidor."
      );
    }
  }


  // --- SIGNUP / REGISTRO ---
  async function registerAxios({
    email,
    password,
    first_name,
    last_name,
    shipping_address,
    phone,
  }) {
    try {
      const payload = {
        email,
        password,
        first_name,
        last_name,
        shipping_address,
        phone,
      };

      console.log("📝 Signup contra:", `${AUTH_BASE}/auth/signup`, payload);

      const res = await axios.post(`${AUTH_BASE}/auth/signup`, payload);
      const data = res.data;

      const newToken = data.authToken || data.token || data.jwt;
      if (!newToken) {
        throw new Error("El servidor no devolvió un token de autenticación.");
      }

      setToken(newToken);

      let newUser = null;

      if (data.user) {
        newUser = normalizeUser(data.user);
        setUser(newUser);
      } else {
        newUser = await fetchCurrentUser(newToken);
      }

      return { token: newToken, user: newUser };
    } catch (err) {
      console.error("❌ Error en signup:", err);
      throw new Error(
        err?.response?.data?.message ||
        "No se pudo registrar el usuario. Revisa los datos."
      );
    }
  }

  // --- LOGOUT ---
  async function logoutAxios() {
    try {
      if (token) {
        await axios.post(
          `${AUTH_BASE}/auth/logout`,
          {},
          { headers: makeAuthHeader(token) }
        );
      }
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.error("Error al hacer logout en Xano:", err);
      }
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_exp");
    setToken("");
    setUser(null);
    setExpiresAt(null);
  }

  // --- REFRESH TOKEN (opcional) ---
  async function refreshAxios() {
    if (!token) return null;
    try {
      const { data } = await axios.post(
        `${AUTH_BASE}/auth/refresh_token`,
        {},
        { headers: makeAuthHeader(token) }
      );
      const newToken = data.authToken || data.token || data.jwt;
      setToken(newToken);
      return newToken;
    } catch (err) {
      console.error(" Error al refrescar token:", err);
      throw err;
    }
  }

  // --- UPDATE PROFILE (perfil usuario) ---
  async function updateProfileAxios(id, updates) {
    try {
      if (!user) {
        throw new Error("No hay usuario en sesión.");
      }

      // role_id numérico actual
      const currentRoleId =
        typeof user.role_id === "number"
          ? user.role_id
          : user.role === "admin"
            ? 1
            : 2; // por defecto cliente

      // 👇 Construimos lo que REALMENTE se mandará a Xano
      // Este endpoint del grupo auth espera:
      //   - email
      //   - role  (integer, se copia a role_id en Edit Record)
      //   - y los demás campos de perfil
      const payloadForXano = {
        // Siempre mandamos el email actual para que NO se borre
        email: user.email,

        // Siempre mandamos el rol actual como número, para que no quede null
        role: currentRoleId,

        // Para los campos editables, si no vienen en updates usamos el valor actual
        first_name:
          updates.first_name !== undefined
            ? updates.first_name
            : user.first_name || "",
        last_name:
          updates.last_name !== undefined
            ? updates.last_name
            : user.last_name || "",
        phone:
          updates.phone !== undefined ? updates.phone : user.phone || "",
        shipping_address:
          updates.shipping_address !== undefined
            ? updates.shipping_address
            : user.shipping_address || "",
      };

      // Llamada PATCH al mismo endpoint que ya usas
      await axios.patch(`${AUTH_BASE}/user/${id}`, payloadForXano, {
        headers: makeAuthHeader(token),
      });

      // 🔄 Actualizamos SOLO el frontend, sin pisar el `role` string
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          first_name: payloadForXano.first_name,
          last_name: payloadForXano.last_name,
          phone: payloadForXano.phone,
          shipping_address: payloadForXano.shipping_address,
          email: user.email,      // lo mantenemos igual
          role_id: currentRoleId, // por si quieres usarlo
          role: prev.role,        // seguimos usando "admin"/"cliente" en el front
        };
      });

      // Devolvemos una copia útil por si la quieres usar en el componente
      return {
        ...user,
        first_name: payloadForXano.first_name,
        last_name: payloadForXano.last_name,
        phone: payloadForXano.phone,
        shipping_address: payloadForXano.shipping_address,
        role_id: currentRoleId,
      };
    } catch (err) {
      console.error("❌ Error al actualizar perfil:", err);
      throw err;
    }
  }


  // ===============================
  // ⏳ AUTO-RENOVACIÓN DE SESIÓN
  // ===============================
  useEffect(() => {
    if (!expiresAt) return;

    const margin = 2 * 60 * 1000;
    const delay = Math.max(expiresAt - Date.now() - margin, 0);

    const id = setTimeout(async () => {
      const ok = window.confirm("Tu sesión está por expirar. ¿Renovar token?");
      if (ok) {
        try {
          await refreshAxios();
        } catch {
          alert("No se pudo renovar la sesión.");
          await logoutAxios();
        }
      }
    }, delay);

    return () => clearTimeout(id);
  }, [expiresAt]);

  // ===============================
  // 🧩 CONTEXTO FINAL
  // ===============================
  const value = useMemo(
    () => ({
      token,
      user,
      expiresAt,
      loginAxios,
      registerAxios,
      logoutAxios,
      refreshAxios,
      updateProfileAxios,
      fetchCurrentUser,
      setUser,
      setToken,
    }),
    [token, user, expiresAt]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ===============================
// 🪝 HOOK PERSONALIZADO
// ===============================
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
