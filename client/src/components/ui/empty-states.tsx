import React from 'react';
import { Users, GraduationCap, BookOpen, CreditCard, ClipboardCheck, UserCog } from 'lucide-react';
import EmptyState from './empty-state';

// Voor studenten pagina
export const StudentEmptyState = ({ description = "Er zijn momenteel geen studenten beschikbaar." }) => (
  <EmptyState 
    icon={<Users className="h-10 w-10 opacity-30" />}
    title="Geen studenten gevonden" 
    description={description} 
  />
);

// Voor klassen pagina
export const ClassEmptyState = ({ description = "Er zijn momenteel geen klassen beschikbaar." }) => {
  // Aangepast ChalkboardTeacher icoon
  const ChalkBoard = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="h-10 w-10 opacity-30"
    >
      <rect x="2" y="2" width="20" height="14" rx="2" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="6" y1="12" x2="6" y2="20" />
      <line x1="18" y1="12" x2="18" y2="20" />
      <ellipse cx="12" cy="18" rx="3" ry="2" />
      <path d="M10 4h4" />
      <path d="M8 8h8" />
    </svg>
  );

  return (
    <EmptyState 
      icon={<ChalkBoard />}
      title="Geen klassen gevonden" 
      description={description} 
    />
  );
};

// Voor vakken/cursussen pagina
export const CourseEmptyState = ({ description = "Er zijn momenteel geen vakken beschikbaar." }) => (
  <EmptyState 
    icon={<BookOpen className="h-10 w-10 opacity-30" />}
    title="Geen vakken gevonden" 
    description={description} 
  />
);

// Voor facturen/betalingen pagina
export const FeeEmptyState = ({ description = "Er zijn momenteel geen facturen beschikbaar." }) => (
  <EmptyState 
    icon={<CreditCard className="h-10 w-10 opacity-30" />}
    title="Geen facturen gevonden" 
    description={description} 
  />
);

// Voor examens pagina
export const ExamEmptyState = ({ description = "Er zijn momenteel geen examens beschikbaar." }) => (
  <EmptyState 
    icon={<ClipboardCheck className="h-10 w-10 opacity-30" />}
    title="Geen examens gevonden" 
    description={description} 
  />
);

// Voor docenten pagina
export const TeacherEmptyState = ({ description = "Er zijn momenteel geen docenten beschikbaar." }) => (
  <EmptyState 
    icon={<GraduationCap className="h-10 w-10 opacity-30" />}
    title="Geen docenten gevonden" 
    description={description} 
  />
);