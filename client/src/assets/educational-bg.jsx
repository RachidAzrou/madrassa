export const EducationalBg = () => {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
      <defs>
        <pattern id="doodlePattern" patternUnits="userSpaceOnUse" width="200" height="200">
          <g fill="none" stroke="#3b5998" strokeWidth="1.5">
            {/* School Bell */}
            <path d="M30 40a10 10 0 1 1 20 0 10 10 0 0 1-20 0zm10-10v-10M35 45l3 5" />
            
            {/* Book */}
            <path d="M85 30H60c-3 0-5 2-5 5v30c0 3 2 5 5 5h25 M60 40c3 0 5 2 5 5v25" />
            
            {/* Pencil */}
            <path d="M120 35l10 10-20 20-10-10zm-20 20l10 10" />
            
            {/* Apple */}
            <path d="M38 90a7 7 0 1 0 14 0 7 7 0 0 0-14 0zM45 75v8M42 83s-5-10 3-8" />
            
            {/* Ruler */}
            <path d="M70 75v25h20V75zm5 0v4m5-4v8m5-8v4" />
            
            {/* Calculator */}
            <rect x="110" y="75" width="20" height="25" rx="2" />
            <path d="M113 80h14M113 85h14M113 90h5M123 90h5M113 95h5M123 95h5" />
            
            {/* Globe */}
            <circle cx="30" cy="130" r="10" />
            <path d="M20 130h20M30 120a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
            
            {/* ABC Block */}
            <rect x="60" y="120" width="20" height="20" rx="2" />
            <path d="M63 125l5 10h-10zM74 125v10M70 130h8" />
            
            {/* Backpack */}
            <path d="M110 125v-5a5 5 0 0 1 10 0v5m-15 15h20v-15h-20z" />
            <path d="M110 130h20M115 140v-15M125 140v-15" />
            
            {/* Musical Note */}
            <path d="M145 40a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM140 40V25l10-5v5" />
            <path d="M152 32a5 5 0 1 1-10 0 5 5 0 0 1 10 0z" />
            
            {/* Graduation Cap */}
            <path d="M155 80l-15 10v10a10 10 0 0 0 15 5 10 10 0 0 0 15-5V90z" />
            <path d="M155 80l15 10-15 10-15-10zM172 92v15" />
            
            {/* Science Flask */}
            <path d="M145 140h20l-7-20h-6z" />
            <path d="M145 120h20M156 125a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            
            {/* Star */}
            <path d="M175 40l2 6 6 1-4 4 1 6-5-3-5 3 1-6-4-4 6-1z" />
            
            {/* School Building */}
            <rect x="140" y="160" width="40" height="30" />
            <path d="M140 160h40l-20-15zM148 190v-20M172 190v-20M155 175h10" />
            
            {/* Paintbrush */}
            <path d="M30 160c0 10 5 20 15 20s15-10 15-20M45 180v10" />
            
            {/* Paint Palette */}
            <path d="M50 165a15 15 0 0 1 30 0c0 8-15 15-15 15s-15-7-15-15z" />
            <path d="M57 160a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM67 160a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM62 170a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" />
            
            {/* Soccer Ball */}
            <circle cx="90" cy="165" r="15" />
            <path d="M85 155l5 5 5-5M85 175l5-5 5 5M75 165l5 5 5-5M95 165l5 5 5-5" />
            
            {/* A+ Grade */}
            <path d="M20 200l4 10h-8zM18 205h4M30 200v10M25 205h10" />
          </g>
        </pattern>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#doodlePattern)" opacity="0.2" />
      <rect width="100%" height="100%" fill="#3b5998" fillOpacity="0.03" />
    </svg>
  );
};