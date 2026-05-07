import { useState } from 'react';

export const useModalCeres = () => {
	const [isOpen, setIsOpen] = useState(false);

	const openModal = () => setIsOpen(true);
	const closeModal = () => setIsOpen(false);
	const toggleModal = () => setIsOpen((prev) => !prev);

	return { isOpen, openModal, closeModal, toggleModal };
};

export default useModalCeres;
