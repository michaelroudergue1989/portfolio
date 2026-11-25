import { Layout } from '@/components/layout/Layout';
import { useHashScroll } from '@/hooks/useHashScroll';
import { About } from '@/sections/About';
import { Areas } from '@/sections/Areas';
import { Certifications } from '@/sections/Certifications';
import { Contact } from '@/sections/Contact';
import { Education } from '@/sections/Education';
import { Experience } from '@/sections/Experience';
import { Hero } from '@/sections/Hero';
import { Projects } from '@/sections/Projects';
import { Resume } from '@/sections/Resume';
import { Skills } from '@/sections/Skills';
import { Stats } from '@/sections/Stats';

export default function App() {
  useHashScroll();

  return (
    <Layout>
      <Hero />
      <Stats />
      <About />
      <Areas />
      <Experience />
      <Projects />
      <Skills />
      <Education />
      <Certifications />
      <Resume />
      <Contact />
    </Layout>
  );
}
