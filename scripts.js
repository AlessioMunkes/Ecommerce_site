
    // Check for URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has('filter') && params.get('filter') === 'equipment') {
        // Automatically check the equipment checkbox
        const equipmentCheckbox = document.querySelector('#equipment-checkbox'); // Adjust selector as necessary
        if (equipmentCheckbox) {
            equipmentCheckbox.checked = true;
        }
        // Apply filters logic here
        applyFilters(); // Ensure you have a function for applying filters
    }
