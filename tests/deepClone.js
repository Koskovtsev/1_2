function deepClone(object) {
    if (typeof object !== 'object' || object === null) {
        return object;
    }
    if (Array.isArray(object)) {
        return object.map(elem => deepClone(elem));
    }

    return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, deepClone(value)]));
}

const config1 = {
    parent: '#usersTable',
    columns: [
        { title: 'Ім’я', value: 'name', input: {
                type: 'text',
                pattern: '^[A-Za-zА-Яа-яЁёІіЇїЄє]+$',
                minlength: '2',
                title: 'Будь ласка, використовуйте лише літери (без цифр та пробілів)'
            }
        },
        {
            title: 'Прізвище',
            value: 'surname',
            input: {
                type: 'text',
                pattern: '^[A-Za-zА-Яа-яЁёІіЇїЄє]+$',
                minlength: '2',
                title: 'Будь ласка, використовуйте лише літери (без цифр та пробілів)'
            }
        },
        {
            title: 'Вік',
            // value: (user) => getAge(user.birthday),
            input: {
                type: 'date',
                name: 'birthday',
                label: 'Дата народження',
                max: '2026-02-16',
                min: '1900-01-01'
            }
        },
        {
            title: 'Фото',
            // value: (user) => {
            //     const defaultImg = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            //     return `<img src="${user.avatar}" onerror="this.src='${defaultImg}'" alt="${user.name} ${user.surname}"/>`;
            // },
            input:
            {
                type: 'url',
                name: 'avatar',
                placeholder: 'https://images.com/...',
                required: false
            }
        }
    ],
    apiUrl: "https://mock-api.shpp.me/akoskovtsev/users",
    condition: {
        exclude: [{
            surname: 'Smith'
        }],
        sortBy: ['age']
    }
};

const newObject = deepClone(config1);
console.log(JSON.stringify(newObject, null, 2));
console.log("=====================================");
console.log(JSON.stringify(structuredClone(config1), null, 2));