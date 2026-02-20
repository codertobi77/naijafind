import type { ReactNode } from 'react';

interface TeamMemberProps {
  name: string;
  role: string;
  image: string;
  delay?: number;
}

export function TeamMember({ name, role, image, delay = 0 }: TeamMemberProps) {
  return (
    <div
      className="text-center group animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-48 h-48 mx-auto mb-8 rounded-3xl overflow-hidden shadow-xl border-4 border-white group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
        <img src={image} alt={name} className="w-full h-full object-cover object-top" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
        {name}
      </h3>
      <p className="text-green-600 font-semibold text-lg">{role}</p>
    </div>
  );
}

interface TeamGridProps {
  members: Array<{
    name: string;
    role: string;
    image: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function TeamGrid({ members, columns = 3, className = '' }: TeamGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-10 ${className}`}>
      {members.map((member, index) => (
        <TeamMember key={index} {...member} delay={index * 0.1} />
      ))}
    </div>
  );
}

interface ContactInfoItemProps {
  icon: string;
  title: string;
  content: ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export function ContactInfoItem({
  icon,
  title,
  content,
  iconBg = 'bg-green-100',
  iconColor = 'text-green-600',
}: ContactInfoItemProps) {
  return (
    <div className="flex items-start">
      <div
        className={`w-10 sm:w-12 h-10 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}
      >
        <i className={`${icon} ${iconColor} text-lg sm:text-xl`}></i>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{title}</h4>
        <div className="text-gray-600 text-sm sm:text-base">{content}</div>
      </div>
    </div>
  );
}

interface ContactInfoCardProps {
  items: Array<{
    icon: string;
    title: string;
    content: ReactNode;
    iconBg?: string;
    iconColor?: string;
  }>;
  className?: string;
  title?: string;
}

export function ContactInfoCard({ items, className = '', title }: ContactInfoCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 sm:p-8 ${className}`}>
      {title && <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">{title}</h3>}
      <div className="space-y-4 sm:space-y-6">
        {items.map((item, index) => (
          <ContactInfoItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}

interface ValueCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}

export function ValueCard({ icon, iconColor, iconBg, title, description }: ValueCardProps) {
  return (
    <div className="group bg-white rounded-2xl p-8 text-center shadow-soft hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
      <div
        className={`w-20 h-20 bg-gradient-to-br ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}
      >
        <i className={`${icon} text-3xl ${iconColor}`}></i>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
