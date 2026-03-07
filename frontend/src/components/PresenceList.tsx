import { useStore } from '../store';

export default function PresenceList() {
    const { collaborators, user } = useStore();
    const otherCollaborators = Object.values(collaborators).filter(c => c._id !== user?._id);

    return (
        <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
                {user && (
                    <div 
                        className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm relative z-20"
                        style={{ backgroundColor: user.color || '#3B82F6' }}
                        title={`You (${user.name})`}
                    >
                        {user.name?.[0].toUpperCase()}
                    </div>
                )}
                {otherCollaborators.map((c, i) => (
                    <div 
                        key={c._id || i}
                        className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm relative"
                        style={{ backgroundColor: c.color || '#94A3B8', zIndex: 10 - i }}
                        title={c.name}
                    >
                        {c.name?.[0].toUpperCase()}
                    </div>
                ))}
            </div>
            {otherCollaborators.length > 0 && (
                <span className="text-[10px] font-medium text-zinc-400">
                    +{otherCollaborators.length} collaborator{otherCollaborators.length > 1 ? 's' : ''}
                </span>
            )}
        </div>
    );
}
