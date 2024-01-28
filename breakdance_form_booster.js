/**
 * FieldCheckbox
 * 
 * Klasa do obsługi grupy checkboxów 
 * Tworzymy obiekt przekazując do konstruktora id grupy checkboxów
 * 
 * noneOfTheAboveCheckbox - opcjonalna funkcja, jeśli chcemy dodać checkbox "Żadne z powyższych" wewnątrz grupy
 */
class FieldCheckbox {
    constructor(inputId) {
        this.container = document.querySelector(`[name="fields[${inputId}][]"]`).closest('.breakdance-form-field');
        this.checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        this.noneOfTheAboveCheckbox = this.container.querySelector('input[value="Żadne z powyższych"]');
        this.init();
    }

    init() {
        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handleCheckboxChange(checkbox);
            });
        });

        if (this.noneOfTheAboveCheckbox) {
            this.noneOfTheAboveCheckbox.addEventListener('change', () => {
                this.handleNoneOfTheAboveChange();
            });
        }
    }

    handleCheckboxChange(checkbox) {
        if (this.noneOfTheAboveCheckbox && checkbox !== this.noneOfTheAboveCheckbox && checkbox.checked) {
            this.noneOfTheAboveCheckbox.checked = false;
            this.updateCheckboxStyle(this.noneOfTheAboveCheckbox);
        }
        this.updateCheckboxStyle(checkbox);
    }

    handleNoneOfTheAboveChange() {
        this.checkboxes.forEach(checkbox => {
            if (checkbox !== this.noneOfTheAboveCheckbox) {
                checkbox.disabled = this.noneOfTheAboveCheckbox.checked;
                checkbox.checked = false;
                this.updateCheckboxStyle(checkbox);
            }
        });
    }

    updateCheckboxStyle(checkbox) {
        const checkboxContainer = checkbox.closest('.breakdance-form-checkbox');
        if (checkbox.checked) {
            checkboxContainer.style.background = 'var(--bde-brand-primary-color)';
            checkboxContainer.style.color = 'white';
        } else if (checkbox.disabled){
            checkboxContainer.style.background = 'white';
            checkboxContainer.style.color = 'lightgray';
        } else {
            checkboxContainer.style.background = '';
            checkboxContainer.style.color = '';
        }
    }

    // Pobiera wartości zaznaczonych checkboxów
    getValues() {
        return Array.from(this.checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }

    // Ustawia zaznaczenie checkboxów na podstawie podanych wartości
    setValues(values) {
        Array.from(this.checkboxes).forEach(checkbox => {
            checkbox.checked = values.includes(checkbox.value);
            this.updateCheckboxStyle(checkbox);
        });
    }

    // Sprawdza, czy jakikolwiek checkbox jest zaznaczony
    isAnyChecked() {
        return Array.from(this.checkboxes).some(checkbox => checkbox.checked);
    }
}

class FieldRadio {
    constructor(inputId) {
        this.container = document.querySelector(`[name="fields[${inputId}][]"]`).closest('.breakdance-form-field');
        this.radiobuttons = this.container.querySelectorAll('input[type="radio"]');
        this.init();
    }

    init() {
        this.radiobuttons.forEach(radiobutton => {
            radiobutton.addEventListener('change', () => {
                this.handleRadioChange(radiobutton);
            });
        });
    }

    handleRadioChange(radiobutton) {
        this.updateRadioStyle();
    }

    updateRadioStyle() {
        this.radiobuttons.forEach(radio => {
            const radioContainer = radio.closest('.breakdance-form-radio');
            if (radio.checked) {
                radioContainer.style.background = 'var(--bde-brand-primary-color)';
                radioContainer.style.color = 'white';
            } else {
                radioContainer.style.background = '';
                radioContainer.style.color = '';
            }
        });
    }

    getValues() {
        const checkedRadio = Array.from(this.radiobuttons).find(radio => radio.checked);
        return checkedRadio ? [checkedRadio.value] : [];
    }

    setValues(values) {
        Array.from(this.radiobuttons).forEach(radio => {
            radio.checked = values.includes(radio.value);
            this.updateRadioStyle();
        });
    }
}

class FieldText {
    constructor(inputName) {
        this.element = document.querySelector(`input[name="fields[${inputName}]"]`);
    }

    setValue(value) {
        if (this.element) {
            this.element.value = value;
        }
    }

    getValue() {
        return this.element ? this.element.value : null;
    }
}

class FieldSelect {
    constructor(inputName) {
        this.inputName = inputName;
        this.container = document.querySelector(`select[name="fields[${this.inputName}]"]`).closest('.breakdance-form-field');
        this.element = document.querySelector(`select[name="fields[${this.inputName}]"]`);
        this.updateFirstOption();
    }

    updateFirstOption() {
        try {
            if (this.element.options[0] && this.element.options[0].value === "") {
                this.element.options[0].text = "Wybierz odpowiedź...";
            }
        } catch (e) {
            console.log('Error while updating first option text', this.inputName);
            console.error(e);
        }
         
    }

    setValue(value) {
        if (this.element) {
            let optionFound = false;
            for (let option of this.element.options) {
                if (option.value === value) {
                    option.selected = true;
                    optionFound = true;
                    break;
                }
            }
            // Jeśli nie znaleziono odpowiadającej opcji, możesz chcieć obsłużyć ten przypadek
            if (!optionFound) {
                console.warn(`Option with value '${value}' not found in select field.`);
            }
        }
    }

    getValues() {
        return this.element ? this.element.value : null;
    }
}

class BreakdanceFormBooster {
    // Private form state
    #formState = {
        fields: {},
        errors: {},
        isSubmitting: false,
        isSubmitted: false,
        isFormValid: false,
    };

    constructor(selector, panelData) {
        this.element = document.querySelector(selector);

        // Usuń addEvenetListenery z poprzedniego formularza
        // this.element.replaceWith(this.element.cloneNode(true)); 
        
        this.panelData = panelData;
        this.#formState = {
            fields: {},
            errors: {},
            isSubmitting: false,
            isSubmitted: false,
            isFormValid: false,
        };
        this.initializeFields();
        this.setIdToFieldsContainers();
        this.setFormEvents();
    }

    setIdToFieldsContainers() {
        Object.keys(this.#formState.fields).forEach(fieldKey => {
            const field = this.#formState.fields[fieldKey];
            if (field && field.container) {
                field.container.id = fieldKey;
            }
        });
    }
    
    // Metoda do tworzenia przycisku Zapisz zmiany
    createSaveButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'button-atom button-atom--primary breakdance-form-button';
        button.style.marginLeft = 'auto';
        button.id = 'breakdance-form-save';
        button.name = 'breakdance-form-save';
        button.value = 'Zapisz zmiany';
        button.textContent = 'Zapisz zmiany';

        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSaveFormDialog('/wp-json/custom-endpoint/v1/save-form');
        });

        const footer = this.element.querySelector('.breakdance-form-footer');
        
        if (footer) {
            footer.appendChild(button);
        }
    }

    // Change input.name to id (fields[m2_1_2][] -> m2_1_2)
    getFieldId(input) {
        return input.name.replace('fields[', '').replace('][]', '').replace(']', '');
    }

    getFieldById(id) {
        return this.#formState.fields[id];
    }

    // Metoda do zapisywania stanu formularza
    saveFormState(endpoint) {
        const formData = this.getFormData();
        const dmaData = {
            'fields': formData,
            'post_id': this.panelData.post_id,
            'user_id': this.panelData.user_id,
            'nonce': this.panelData.nonce,
            'dma_id': window.location.search.replace('?dma_id=', '') || ''
        };

        fetch(this.panelData.home_url + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.panelData.nonce
            },
            body: JSON.stringify(dmaData)
        })
        .then(response => response.json())
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Zapisano zmiany',
                showConfirmButton: false,
                timer: 1500
            });
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Coś poszło nie tak!',
                footer: 'Spróbuj ponownie później'
            });
        });
    }

    showSaveFormDialog(endpoint) {
        const formData = this.getFormData();
        const dmaData = {
            'fields': formData,
            'post_id': this.panelData.post_id,
            'user_id': this.panelData.user_id,
            'nonce': this.panelData.nonce,
            'dma_id': window.location.search.replace('?dma_id=', '') || ''
        };
    
        Swal.fire({
            title: 'Czy chcesz zapisać zmiany?',
            showCancelButton: true,
            confirmButtonText: 'Zapisz',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return fetch(this.panelData.home_url + endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': this.panelData.nonce
                    },
                    body: JSON.stringify(dmaData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Coś poszło nie tak!');
                    }
                    return response.json();
                })
                .catch(error => {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                });
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Zapisano zmiany',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    }
    

    // Metoda do pobierania danych z formularza
    getFormData() {
        // Implementacja pobierania danych z formularza
        const formData = {};
        for (const field in this.#formState.fields) {
            const fieldData = this.#formState.fields[field].getValues();
            formData[field] = fieldData;
        }
        return formData;
    }

    setFormData(formData) {
        for (const fieldId in formData) {
            const fieldData = formData[fieldId];
    
            if (Array.isArray(fieldData)) {
                // Dla checkboxów
                const checkboxField = this.getFieldById(fieldId);
                if(checkboxField){
                    checkboxField.setValues(fieldData);
                }
            } else {
                // Sprawdza typ elementu formularza
                const inputElement = document.querySelector(`input[name="fields[${fieldId}]"], select[name="fields[${fieldId}]"]`);
                if (inputElement) {
                    if (inputElement.tagName === 'SELECT') {
                        const selectField = this.getFieldById(fieldId);
                        selectField.setValue(fieldData);
                    } else {
                        const textField = this.getFieldById(fieldId);
                        textField.setValue(fieldData);
                    }
                }
            }
        }
    }

    extractFieldType(element) {
        if (!element || !element.classList) {
            return null;
        }

        const prefix = 'breakdance-form-field--';
        for (let className of element.classList) {
            if (className.startsWith(prefix)) {
                return className.slice(prefix.length);
            }
        }

        return null;
    }

    // Initialize form fields
    initializeFields() {
        // Find all elements with class .breakdance-form-field directly inside form element
        const fields = this.element.querySelectorAll('.breakdance-form-field');

        // przejście po wszystkich polach formularza 
        fields.forEach(field => {

            // Sprawdzenie typu pola po klasie css
            const fieldType = this.extractFieldType(field);

            let fieldId = null;

            // Inicjalizacja pola
            switch (fieldType) {
                case 'checkbox':
                    fieldId = this.getFieldId(field.querySelector('input'));
                    this.#formState.fields[fieldId] = new FieldCheckbox(fieldId);
                    break;
                case 'select':
                    fieldId = this.getFieldId(field.querySelector('select'));
                    this.#formState.fields[fieldId] = new FieldSelect(fieldId);
                    break;
                case 'radio':
                    fieldId = this.getFieldId(field.querySelector('input'));
                    this.#formState.fields[fieldId] = new FieldRadio(fieldId);
                    break;
                default:
                    // this.#formState.fields[fieldId] = new FieldText(fieldId);
                    break;
            }
            
        });
    }

    // Ustawianie eventów formularza
    setFormEvents() {
        this.element.addEventListener('submit', this.handleSubmit.bind(this));

        // Można tu dodać dodatkowe zdarzenia dla pól formularza
    }

    handleSubmit(event) {
        event.preventDefault();
        this.#formState.isSubmitting = true;
        console.log('Form is being submitted...');
        
        // Tutaj można dodać logikę walidacji i przetwarzania formularza
    }

}


if (!window.CustomClasses) {
    window.CustomClasses = {};
}

window.CustomClasses.BreakdanceFormBooster = BreakdanceFormBooster;
