import { useState, useEffect, createContext, useContext } from 'react';

export type Language = 'en' | 'ru' | 'ge';

export interface Translation {
  // Navigation
  'nav.admin': string;
  'nav.language': string;
  
  // Hero section
  'hero.title': string;
  'hero.subtitle': string;
  'hero.cta': string;
  
  // Tours section
  'tours.title': string;
  'tours.subtitle': string;
  'tours.perPerson': string;
  'tours.duration.days': string;
  'tours.duration.hours': string;
  'tours.duration.multiDay': string;
  'tours.duration.dayTrip': string;
  
  // Tour details
  'tour.about': string;
  'tour.highlights': string;
  'tour.book': string;
  'tour.share': string;
  'tour.smallGroup': string;
  
  // Booking form
  'booking.title': string;
  'booking.selectDate': string;
  'booking.availableDates': string;
  'booking.numberOfPeople': string;
  'booking.selectPeople': string;
  'booking.phone': string;
  'booking.phonePlaceholder': string;
  'booking.email': string;
  'booking.emailPlaceholder': string;
  'booking.emailOptional': string;
  'booking.specialRequests': string;
  'booking.specialRequestsPlaceholder': string;
  'booking.totalPrice': string;
  'booking.paymentNote': string;
  'booking.submit': string;
  'booking.confirmationNote': string;
  'booking.success': string;
  
  // Admin
  'admin.login': string;
  'admin.username': string;
  'admin.password': string;
  'admin.dashboard': string;
  'admin.logout': string;
  'admin.addTour': string;
  'admin.totalTours': string;
  'admin.pendingBookings': string;
  'admin.thisMonth': string;
  'admin.revenue': string;
  'admin.manageTours': string;
  'admin.tourName': string;
  'admin.duration': string;
  'admin.price': string;
  'admin.status': string;
  'admin.actions': string;
  'admin.active': string;
  
  // Footer
  'footer.quickLinks': string;
  'footer.popularTours': string;
  'footer.contact': string;
  'footer.allTours': string;
  'footer.about': string;
  'footer.faq': string;
  'footer.svanetiMountains': string;
  'footer.tbilisiCity': string;
  'footer.wineTasting': string;
  'footer.blackSeaCoast': string;
  'footer.copyright': string;
  
  // Common
  'common.close': string;
  'common.edit': string;
  'common.delete': string;
  'common.save': string;
  'common.cancel': string;
}

const translations: Record<Language, Translation> = {
  en: {
    // Navigation
    'nav.admin': 'Admin',
    'nav.language': 'Language',
    
    // Hero section
    'hero.title': 'Discover the Magic of Georgia',
    'hero.subtitle': 'Experience authentic Georgian culture, breathtaking landscapes, and unforgettable adventures with our expertly crafted tours.',
    'hero.cta': 'Explore Tours',
    
    // Tours section
    'tours.title': 'Our Featured Tours',
    'tours.subtitle': 'Choose from our carefully curated selection of tours that showcase the best of Georgia\'s natural beauty and rich cultural heritage.',
    'tours.perPerson': 'per person',
    'tours.duration.days': 'Days',
    'tours.duration.hours': 'Hours',
    'tours.duration.multiDay': 'Multi-day',
    'tours.duration.dayTrip': 'Day trip',
    
    // Tour details
    'tour.about': 'About This Tour',
    'tour.highlights': 'Tour Highlights',
    'tour.book': 'Book This Tour',
    'tour.share': 'Share Tour',
    'tour.smallGroup': 'Small group (8-12 people)',
    
    // Booking form
    'booking.title': 'Book Your Tour',
    'booking.selectDate': 'Select Date',
    'booking.availableDates': 'Available dates for the next 3 months',
    'booking.numberOfPeople': 'Number of People',
    'booking.selectPeople': 'Select number of people',
    'booking.phone': 'Phone Number',
    'booking.phonePlaceholder': '+995 XXX XXX XXX',
    'booking.email': 'Email',
    'booking.emailPlaceholder': 'your@email.com',
    'booking.emailOptional': 'Email (Optional)',
    'booking.specialRequests': 'Special Requests (Optional)',
    'booking.specialRequestsPlaceholder': 'Any special requirements or requests...',
    'booking.totalPrice': 'Total Price:',
    'booking.paymentNote': 'Payment will be arranged directly with tour guide',
    'booking.submit': 'Submit Booking Request',
    'booking.confirmationNote': 'Our tour guide will contact you within 24 hours to confirm your booking',
    'booking.success': 'Booking request submitted! Our tour guide will contact you within 24 hours.',
    
    // Admin
    'admin.login': 'Login',
    'admin.username': 'Username',
    'admin.password': 'Password',
    'admin.dashboard': 'Admin Dashboard',
    'admin.logout': 'Logout',
    'admin.addTour': 'Add New Tour',
    'admin.totalTours': 'Total Tours',
    'admin.pendingBookings': 'Pending Bookings',
    'admin.thisMonth': 'This Month',
    'admin.revenue': 'Revenue',
    'admin.manageTours': 'Manage Tours',
    'admin.tourName': 'Tour Name',
    'admin.duration': 'Duration',
    'admin.price': 'Price (GEL)',
    'admin.status': 'Status',
    'admin.actions': 'Actions',
    'admin.active': 'Active',
    
    // Footer
    'footer.quickLinks': 'Quick Links',
    'footer.popularTours': 'Popular Tours',
    'footer.contact': 'Contact Info',
    'footer.allTours': 'All Tours',
    'footer.about': 'About Us',
    'footer.faq': 'FAQ',
    'footer.svanetiMountains': 'Svaneti Mountains',
    'footer.tbilisiCity': 'Tbilisi City',
    'footer.wineTasting': 'Wine Tasting',
    'footer.blackSeaCoast': 'Black Sea Coast',
    'footer.copyright': '© 2024 Georgia Tours. All rights reserved.',
    
    // Common
    'common.close': 'Close',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
  },
  ru: {
    // Navigation
    'nav.admin': 'Админ',
    'nav.language': 'Язык',
    
    // Hero section
    'hero.title': 'Откройте для себя магию Грузии',
    'hero.subtitle': 'Испытайте аутентичную грузинскую культуру, захватывающие пейзажи и незабываемые приключения с нашими экспертно подготовленными турами.',
    'hero.cta': 'Исследовать туры',
    
    // Tours section
    'tours.title': 'Наши рекомендуемые туры',
    'tours.subtitle': 'Выберите из нашей тщательно отобранной коллекции туров, которые демонстрируют лучшее из природной красоты и богатого культурного наследия Грузии.',
    'tours.perPerson': 'за человека',
    'tours.duration.days': 'Дней',
    'tours.duration.hours': 'Часов',
    'tours.duration.multiDay': 'Многодневный',
    'tours.duration.dayTrip': 'Однодневный',
    
    // Tour details
    'tour.about': 'О туре',
    'tour.highlights': 'Основные моменты тура',
    'tour.book': 'Забронировать тур',
    'tour.share': 'Поделиться туром',
    'tour.smallGroup': 'Небольшая группа (8-12 человек)',
    
    // Booking form
    'booking.title': 'Забронировать тур',
    'booking.selectDate': 'Выберите дату',
    'booking.availableDates': 'Доступные даты на следующие 3 месяца',
    'booking.numberOfPeople': 'Количество людей',
    'booking.selectPeople': 'Выберите количество людей',
    'booking.phone': 'Номер телефона',
    'booking.phonePlaceholder': '+995 XXX XXX XXX',
    'booking.email': 'Email',
    'booking.emailPlaceholder': 'your@email.com',
    'booking.emailOptional': 'Email (по желанию)',
    'booking.specialRequests': 'Особые пожелания (по желанию)',
    'booking.specialRequestsPlaceholder': 'Любые особые требования или пожелания...',
    'booking.totalPrice': 'Общая цена:',
    'booking.paymentNote': 'Оплата будет организована напрямую с гидом',
    'booking.submit': 'Отправить запрос на бронирование',
    'booking.confirmationNote': 'Наш гид свяжется с вами в течение 24 часов для подтверждения бронирования',
    'booking.success': 'Запрос на бронирование отправлен! Наш гид свяжется с вами в течение 24 часов.',
    
    // Admin
    'admin.login': 'Войти',
    'admin.username': 'Имя пользователя',
    'admin.password': 'Пароль',
    'admin.dashboard': 'Панель администратора',
    'admin.logout': 'Выйти',
    'admin.addTour': 'Добавить новый тур',
    'admin.totalTours': 'Всего туров',
    'admin.pendingBookings': 'Ожидающие бронирования',
    'admin.thisMonth': 'В этом месяце',
    'admin.revenue': 'Доход',
    'admin.manageTours': 'Управление турами',
    'admin.tourName': 'Название тура',
    'admin.duration': 'Продолжительность',
    'admin.price': 'Цена (лари)',
    'admin.status': 'Статус',
    'admin.actions': 'Действия',
    'admin.active': 'Активный',
    
    // Footer
    'footer.quickLinks': 'Быстрые ссылки',
    'footer.popularTours': 'Популярные туры',
    'footer.contact': 'Контактная информация',
    'footer.allTours': 'Все туры',
    'footer.about': 'О нас',
    'footer.faq': 'FAQ',
    'footer.svanetiMountains': 'Горы Сванетии',
    'footer.tbilisiCity': 'Город Тбилиси',
    'footer.wineTasting': 'Дегустация вин',
    'footer.blackSeaCoast': 'Побережье Черного моря',
    'footer.copyright': '© 2024 Georgia Tours. Все права защищены.',
    
    // Common
    'common.close': 'Закрыть',
    'common.edit': 'Редактировать',
    'common.delete': 'Удалить',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
  },
  ge: {
    // Navigation
    'nav.admin': 'ადმინი',
    'nav.language': 'ენა',
    
    // Hero section
    'hero.title': 'აღმოაჩინეთ საქართველოს მაგია',
    'hero.subtitle': 'განიცადეთ ავთენტური ქართული კულტურა, თვალწარმტაცი პეიზაჟები და დაუვიწყარი თავგადასავლები ჩვენი ექსპერტულად შედგენილი ტურებით.',
    'hero.cta': 'ტურების გაცნობა',
    
    // Tours section
    'tours.title': 'ჩვენი რჩეული ტურები',
    'tours.subtitle': 'აირჩიეთ ჩვენი ყურადღებით შერჩეული ტურების კოლექციიდან, რომლებიც წარმოაჩენს საქართველოს ბუნებრივი სილამაზისა და მდიდარი კულტურული მემკვიდრეობის საუკეთესოს.',
    'tours.perPerson': 'პირზე',
    'tours.duration.days': 'დღე',
    'tours.duration.hours': 'საათი',
    'tours.duration.multiDay': 'მრავალდღიანი',
    'tours.duration.dayTrip': 'ერთდღიანი',
    
    // Tour details
    'tour.about': 'ტურის შესახებ',
    'tour.highlights': 'ტურის ძირითადი მომენტები',
    'tour.book': 'ტურის დაჯავშნა',
    'tour.share': 'ტურის გაზიარება',
    'tour.smallGroup': 'მცირე ჯგუფი (8-12 ადამიანი)',
    
    // Booking form
    'booking.title': 'ტურის დაჯავშნა',
    'booking.selectDate': 'აირჩიეთ თარიღი',
    'booking.availableDates': 'ხელმისაწვდომი თარიღები შემდეგი 3 თვისთვის',
    'booking.numberOfPeople': 'ადამიანების რაოდენობა',
    'booking.selectPeople': 'აირჩიეთ ადამიანების რაოდენობა',
    'booking.phone': 'ტელეფონის ნომერი',
    'booking.phonePlaceholder': '+995 XXX XXX XXX',
    'booking.email': 'ელ-ფოსტა',
    'booking.emailPlaceholder': 'your@email.com',
    'booking.emailOptional': 'ელ-ფოსტა (არასავალდებულო)',
    'booking.specialRequests': 'სპეციალური მოთხოვნები (არასავალდებულო)',
    'booking.specialRequestsPlaceholder': 'ნებისმიერი სპეციალური მოთხოვნები ან თხოვნები...',
    'booking.totalPrice': 'სრული ფასი:',
    'booking.paymentNote': 'გადახდა მოეწყობება პირდაპირ ტურის გიდთან',
    'booking.submit': 'დაჯავშნის მოთხოვნის გაგზავნა',
    'booking.confirmationNote': 'ჩვენი ტურის გიდი დაგიკავშირდებათ 24 საათში დაჯავშნის დასადასტურებლად',
    'booking.success': 'დაჯავშნის მოთხოვნა გაიგზავნა! ჩვენი ტურის გიდი დაგიკავშირდებათ 24 საათში.',
    
    // Admin
    'admin.login': 'შესვლა',
    'admin.username': 'მომხმარებლის სახელი',
    'admin.password': 'პაროლი',
    'admin.dashboard': 'ადმინისტრაციული პანელი',
    'admin.logout': 'გასვლა',
    'admin.addTour': 'ახალი ტურის დამატება',
    'admin.totalTours': 'სულ ტურები',
    'admin.pendingBookings': 'მოლოდინში მყოფი დაჯავშნები',
    'admin.thisMonth': 'ამ თვეში',
    'admin.revenue': 'შემოსავალი',
    'admin.manageTours': 'ტურების მართვა',
    'admin.tourName': 'ტურის სახელი',
    'admin.duration': 'ხანგრძლივობა',
    'admin.price': 'ფასი (ლარი)',
    'admin.status': 'სტატუსი',
    'admin.actions': 'მოქმედებები',
    'admin.active': 'აქტიური',
    
    // Footer
    'footer.quickLinks': 'სწრაფი ბმულები',
    'footer.popularTours': 'პოპულარული ტურები',
    'footer.contact': 'საკონტაქტო ინფორმაცია',
    'footer.allTours': 'ყველა ტური',
    'footer.about': 'ჩვენ შესახებ',
    'footer.faq': 'FAQ',
    'footer.svanetiMountains': 'სვანეთის მთები',
    'footer.tbilisiCity': 'ქალაქი თბილისი',
    'footer.wineTasting': 'ღვინის დეგუსტაცია',
    'footer.blackSeaCoast': 'შავი ზღვის სანაპირო',
    'footer.copyright': '© 2024 Georgia Tours. ყველა უფლება დაცულია.',
    
    // Common
    'common.close': 'დახურვა',
    'common.edit': 'რედაქტირება',
    'common.delete': 'წაშლა',
    'common.save': 'შენახვა',
    'common.cancel': 'გაუქმება',
  },
};

// Create a context for language state
interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => void;
  t: (key: keyof Translation) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Create a global language state
let globalLanguageState = {
  currentLanguage: 'en' as Language,
  listeners: new Set<() => void>(),
};

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const savedLanguage = localStorage.getItem('language') as Language;
  if (savedLanguage && ['en', 'ru', 'ge'].includes(savedLanguage)) {
    globalLanguageState.currentLanguage = savedLanguage;
  }
}

export function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(globalLanguageState.currentLanguage);

  useEffect(() => {
    const listener = () => {
      setCurrentLanguage(globalLanguageState.currentLanguage);
    };
    
    globalLanguageState.listeners.add(listener);
    
    return () => {
      globalLanguageState.listeners.delete(listener);
    };
  }, []);

  const changeLanguage = (language: Language) => {
    globalLanguageState.currentLanguage = language;
    localStorage.setItem('language', language);
    
    // Notify all listeners
    globalLanguageState.listeners.forEach(listener => listener());
  };

  const t = (key: keyof Translation): string => {
    return translations[currentLanguage][key] || key;
  };

  return {
    currentLanguage,
    changeLanguage,
    t,
  };
}
