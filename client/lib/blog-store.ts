import { BlogPost } from "@shared/api";

// Bu, veritabanı yerine geçen geçici bir bellek içi depodur.
// Sayfa yenilendiğinde veriler sıfırlanacaktır.
let posts: BlogPost[] = [
  {
    id: "1",
    title: "Teknoloji Dünyasındaki Son Gelişmeler",
    content: "Yapay zeka ve makine öğrenmesi alanında yaşanan son gelişmeler, teknoloji dünyasını yeniden şekillendiriyor. Özellikle büyük dil modelleri, insan-bilgisayar etkileşiminde yeni bir çığır açıyor. Bu modeller, metin üretme, çeviri yapma, ve hatta kod yazma gibi karmaşık görevleri başarıyla yerine getirebiliyor. Gelecekte bu teknolojilerin hayatımızın her alanında daha fazla yer alması bekleniyor.",
    author: "Ahmet Yılmaz",
    date: "2024-05-15T10:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Sağlıklı Yaşam İçin 5 Altın Kural",
    content: "Dengeli beslenme, düzenli egzersiz, yeterli uyku, stresten uzak durma ve bol su tüketimi, sağlıklı bir yaşamın temel taşlarıdır. Bu kuralları hayatınıza entegre ederek yaşam kalitenizi artırabilirsiniz. Özellikle işlenmiş gıdalardan kaçınmak ve taze sebze-meyve tüketimini artırmak, uzun vadede sağlığınız için yapabileceğiniz en iyi yatırımlardan biridir.",
    author: "Ayşe Kaya",
    date: "2024-05-14T14:30:00Z",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop",
  },
];

export const getBlogPosts = () => posts;

export const getBlogPostById = (id: string) => posts.find(p => p.id === id);

export const addBlogPost = (postData: Omit<BlogPost, 'id' | 'date'>) => {
  const newPost: BlogPost = {
    id: Date.now().toString(),
    ...postData,
    date: new Date().toISOString(),
  };
  // Yeni gönderiyi listenin başına ekle
  posts = [newPost, ...posts];
  return newPost;
};