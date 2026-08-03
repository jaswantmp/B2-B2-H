// src/components/AvatarPicker.jsx
import React from 'react'
import avatars from '../constants/avatars.js'

/**
 * AvatarPicker Component
 *
 * @param {Object} props
 * @param {string} [props.selectedAvatar] - Currently selected avatar URL path (e.g. '/avatars/avatar17.png')
 * @param {Function} props.onSelect - Callback invoked when an avatar is clicked (avatarPath => void)
 */
export default function AvatarPicker({ selectedAvatar, onSelect }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-4 max-h-[420px] overflow-y-auto p-2 scrollbar-thin">
        {avatars.map((avatarPath, index) => {
          const isSelected = selectedAvatar === avatarPath

          return (
            <button
              key={avatarPath}
              type="button"
              onClick={() => onSelect && onSelect(avatarPath)}
              className={`
                relative flex items-center justify-center rounded-full p-0.5
                w-[72px] h-[72px] mx-auto flex-shrink-0 cursor-pointer
                transition-transform duration-200 hover:scale-105 hover:z-10
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${isSelected
                  ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900 scale-105 z-10'
                  : 'hover:ring-2 hover:ring-blue-400/50'
                }
              `}
              aria-label={`Select Avatar ${index + 1}`}
              aria-pressed={isSelected}
            >
              <img
                src={avatarPath}
                alt={`Avatar ${index + 1}`}
                className="w-full h-full rounded-full object-cover bg-slate-800"
                loading="lazy"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
