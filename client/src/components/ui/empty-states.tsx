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
export const ClassEmptyState = ({ description = "Er zijn momenteel geen klassen beschikbaar." }) => (
  <EmptyState 
    icon={<GraduationCap className="h-10 w-10 opacity-30" />}
    title="Geen klassen gevonden" 
    description={description} 
  />
);

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