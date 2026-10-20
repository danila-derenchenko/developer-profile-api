export interface ProfileData {
  name: string;
  description: string;
  links: { label: string; url: string }[];
  skills: { name: string }[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;
    achievements: string[];
  }[];
  projects: { name: string; description: string; url: string }[];
}

// The resume specifies months only; day 01 represents month-level precision.
export const profileData: ProfileData = {
  name: 'Деренченко Данила Андреевич',
  description:
    'Frontend-разработчик с опытом коммерческой разработки на Angular и TypeScript. ' +
    'Работал над крупным production-приложением в сфере финансов и трейдинга: ' +
    'разрабатывал UI-компоненты, дашборды, графики и интерфейсы для работы с торговыми данными. ' +
    'Уверенно работаю с RxJS, REST API, unit- и e2e-тестами. ' +
    'Есть опыт разработки сложной функциональности с нуля и её интеграции в существующее приложение.',
  links: [
    {
      label: 'Резюме на HeadHunter',
      url: 'https://samara.hh.ru/resume/2624ad72ff111dbb970039ed1f495071396551',
    },
  ],
  skills: [
    { name: 'JavaScript' },
    { name: 'REST API' },
    { name: 'Atlassian Jira' },
    { name: 'Node.js' },
    { name: 'Git' },
    { name: 'CSS3' },
    { name: 'TypeScript' },
    { name: 'React' },
    { name: 'HTML5' },
    { name: 'Vue.js' },
    { name: 'Angular' },
    { name: 'RxJS' },
    { name: 'Английский язык' },
    { name: 'SQL' },
    { name: 'Веб-программирование' },
    { name: 'Python' },
    { name: 'C#' },
  ],
  experience: [
    {
      company: 'CQG',
      position: 'Junior Frontend Developer',
      startDate: '2025-05-01',
      endDate: '2026-08-01',
      achievements: [
        'Разработал новый торговый виджет для создания ордеров по фьючерсам и опционам. ' +
          'Виджет динамически меняется в зависимости от выбранного инструмента и его параметров.',
        'Реализовал логику выбора контрактов, сроков экспирации, страйков и других параметров опциона, ' +
          'а также работу с потоковыми данными через RxJS.',
        'Интегрировал новый функционал в существующее торговое приложение и участвовал в его тестировании.',
      ],
    },
  ],
  projects: [
    {
      name: 'Trading Order Widget',
      description:
        'Новый виджет для постановки ордеров на фьючерсы и опционы. ' +
        'Разрабатывал frontend-часть на Angular и TypeScript, логику работы с торговыми инструментами ' +
        'и потоковыми данными, динамическое обновление интерфейса и интеграцию с существующей системой. ' +
        'Ссылка ведёт на сайт компании CQG; отдельная публичная ссылка на виджет в резюме не указана.',
      url: 'https://www.cqg.com',
    },
  ],
};
