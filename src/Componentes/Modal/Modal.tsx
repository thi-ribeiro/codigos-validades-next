'use client';

interface SimpleModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: SimpleModalProps) {
	if (!isOpen) return null;

	return (
		<div className='modal-container'>
			<div className='modal-backdrop' onClick={onClose}></div>
			<div className='modal-content'>
				<button className='modal-close' onClick={onClose}>
					&times;
				</button>
				{children}
			</div>
		</div>
	);
}
