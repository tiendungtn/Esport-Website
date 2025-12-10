import jwt from "jsonwebtoken";

export function auth(requiredRoles = []) {
  return (req, res, next) => {
    const authz = req.headers.authorization || "";
    const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // Lưu thông tin user (id, role)
      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}
