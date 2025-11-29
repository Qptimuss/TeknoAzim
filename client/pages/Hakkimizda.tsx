import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const projectText1 = "Bu TÜBİTAK projesi, öğrencilerin kendilerini ifade etme becerilerini geliştirmelerini, spor, bilim ve sanat gibi alanlardaki bilgilerini paylaşmalarını ve temel makale yazım tekniklerini öğrenerek mini makaleler yayımlamalarını amaçlamaktadır. Proje kapsamında öğrenciler yazılar hazırlayarak deneyim kazanacak, diğer öğrenciler bu yazıları okuyup yorumlayarak genel kültürlerini ve eleştirel düşünme becerilerini geliştirecektir. Böylece üretim ve tüketim arasında bir öğrenme döngüsü oluşturulacaktır.";

const projectText2 = "Projenin uygulanmasında önce HTML/CSS ve JavaScript ile temel web geliştirme öğrenilmiş, ardından UI/UX tasarımı ve Figma kullanımı ile site tasarımı oluşturulmuştur. Öğrenci blog siteleri incelenerek oyunlaştırma, yapay zeka desteği gibi özgün özellikler belirlenmiştir. Site prototipi, Next.js, React.js ve Shadcn ile front-end, Tailwind ile tasarım, Typescript ile işlevsellik, PostgreSQL ve Supabase ile veri yönetimi kullanılarak Dyad platformu üzerinden geliştirilmiştir. Site Netlify'dan herkese açık hale getirilmiştir.";

const githubLinks = [
  { url: "https://github.com/Qptimuss/TeknoAzim", label: "TeknoAzim GitHub Repo", type: "repo" },
  { url: "https://github.com/CodeNova5566", label: "CodeNova5566 GitHub", type: "developer" },
  { url: "https://github.com/Qptimuss", label: "Qptimuss GitHub", type: "developer" },
];

export default function Hakkimizda() {
  const repoLink = githubLinks.find(link => link.type === 'repo');
  const developerLinks = githubLinks.filter(link => link.type === 'developer');

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-5 py-20 text-center">
      <div className="max-w-4xl">
        <h1 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-outfit font-bold mb-6">
          Hakkımızda
        </h1>
        
        <div className="text-left space-y-6 mb-10">
          <p className="text-muted-foreground text-lg md:text-xl font-roboto font-normal leading-relaxed">
            {projectText1}
          </p>
          <p className="text-muted-foreground text-lg md:text-xl font-roboto font-normal leading-relaxed">
            {projectText2}
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {/* GitHub Sayfamız */}
          <div>
            <h2 className="text-foreground text-2xl font-outfit font-bold mb-4">GitHub Sayfamız</h2>
            {repoLink && (
              <a
                href={repoLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-card border border-border px-8 py-3 font-roboto text-lg text-foreground hover:bg-accent transition-colors"
              >
                <Github className="h-5 w-5" />
                {repoLink.label}
              </a>
            )}
          </div>

          {/* Proje Geliştiricileri */}
          <div>
            <h2 className="text-foreground text-2xl font-outfit font-bold mb-4">Proje Geliştiricileri</h2>
            <div className="flex flex-col items-center space-y-4">
              {developerLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full bg-card border border-border px-8 py-3 font-roboto text-lg text-foreground hover:bg-accent transition-colors"
                >
                  <Github className="h-5 w-5" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}