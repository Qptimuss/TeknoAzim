import { User } from "@/contexts/AuthContext";

// DİKKAT: Üretim ortamı için, bu liste ideal olarak sunucudan güvenli bir şekilde alınmalı
// veya istemci tarafı UI mantığı buna bağlıysa, derleme zamanı ortam değişkeni aracılığıyla yönetilmelidir.
// Kullanıcının girdisine dayanarak anında istemci tarafı UI işlevselliği için buraya sabit kodlanmıştır.
const CLIENT_ADMIN_EMAILS = ["qptimus06@gmail.com"]; // Kullanıcının sağladığı yönetici e-postası

/**
 * Verilen kullanıcı nesnesinin bir yöneticiye karşılık gelip gelmediğini kontrol eder.
 * Bu sadece UI amaçlı bir istemci tarafı kontrolüdür. Sunucu tarafı doğrulama ZORUNLUDUR.
 * Bu fonksiyon artık kullanıcının e-postasının CLIENT_ADMIN_EMAILS listesinde olup olmadığını kontrol eder.
 */
export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.email) {
    return false;
  }
  return CLIENT_ADMIN_EMAILS.includes(user.email);
};