const config = {
            token: atob('Z2hwXzd2U2NnT251UXJSdG12Q3MxSEFVQnpHNFBwd1NwODNuSVlkMA=='),
            repoOwner: 'sampahdoank',
            repoName: 'data',
            filePath: 'nomor/user.json',
            adminPassword: 'ahmadfukucloudqw' 
        };

        const app = document.getElementById('app');
        const adminPassword = document.getElementById('adminPassword');
        const loginBtn = document.getElementById('loginBtn');
        const authError = document.getElementById('authError');
        const newNumber = document.getElementById('newNumber');
        const addNumberBtn = document.getElementById('addNumberBtn');
        const addLoader = document.getElementById('addLoader');
        const addMessage = document.getElementById('addMessage');
        const numberList = document.getElementById('numberList');

        let isAuthenticated = false;
        let numbersData = [];

        checkAuth();

        loginBtn.addEventListener('click', handleLogin);
        addNumberBtn.addEventListener('click', handleAddNumber);
        
        function checkAuth() {
            const auth = localStorage.getItem('fukushima_auth');
            if (auth === config.adminPassword) {
                isAuthenticated = true;
                app.classList.add('logged-in');
                loadNumbers();
            }
        }

        function handleLogin() {
            const password = adminPassword.value.trim();
            if (password === config.adminPassword) {
                isAuthenticated = true;
                localStorage.setItem('fukushima_auth', password);
                app.classList.add('logged-in');
                loadNumbers();
            } else {
                showAuthError('Pw Salah anj lu bukan PT PT');
            }
        }

        function showAuthError(message) {
            authError.textContent = message;
            authError.className = 'message error';
        }

        async function loadNumbers() {
            try {
                const response = await fetch(
                    `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${config.filePath}`,
                    {
                        headers: {
                            'Authorization': `token ${config.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (!response.ok) throw new Error('Failed to load numbers');
                
                const data = await response.json();
                const content = JSON.parse(atob(data.content.replace(/\s/g, '')));
                numbersData = content;
                
                renderNumbers();
            } catch (error) {
                console.error('Error loading numbers:', error);
                numberList.innerHTML = `<p class="error">Failed to load numbers: ${error.message}</p>`;
            }
        }

        function renderNumbers() {
            if (numbersData.length === 0) {
                numberList.innerHTML = '<p>No numbers in database yet</p>';
                return;
            }           
            numberList.innerHTML = numbersData.map(num => `
                <div class="number-item fade-in">
                    <span>${num.nomor}</span>
                    <div class="number-actions">
                        <button class="btn-danger" data-number="${num.nomor}">Delete</button>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('.btn-danger').forEach(btn => {
                btn.addEventListener('click', function() {
                    const numberToDelete = this.getAttribute('data-number');
                    deleteNumber(numberToDelete);
                });
            });
        }

        async function handleAddNumber() {
            const number = newNumber.value.trim();
            
            if (!/^62\d{7,15}$/.test(number)) {
                showAddMessage('Please enter a valid number starting with 62', 'error');
                return;
            }
            
            if (numbersData.some(n => n.nomor === number)) {
                showAddMessage('This number already exists in database', 'error');
                return;
            }
            
            addLoader.style.display = 'inline-block';
            addNumberBtn.disabled = true;
            
            try {
                const getResponse = await fetch(
                    `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${config.filePath}`,
                    {
                        headers: {
                            'Authorization': `token ${config.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (!getResponse.ok) throw new Error('Failed to get current data');
                
                const fileData = await getResponse.json();
                const sha = fileData.sha;
                const currentContent = JSON.parse(atob(fileData.content.replace(/\s/g, '')));
                
                currentContent.push({ nomor: number });
                
                const updateResponse = await fetch(
                    `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${config.filePath}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${config.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Add number ${number}`,
                            content: btoa(JSON.stringify(currentContent, null, 2)),
                            sha: sha
                        })
                    }
                );
                
                if (!updateResponse.ok) throw new Error('Failed to update data');
                
                numbersData = currentContent;
                newNumber.value = '';
                showAddMessage(`Number ${number} added successfully!`, 'success');
                renderNumbers();
            } catch (error) {
                console.error('Error adding number:', error);
                showAddMessage(`Failed to add number: ${error.message}`, 'error');
            } finally {
                addLoader.style.display = 'none';
                addNumberBtn.disabled = false;
            }
        }

        async function deleteNumber(number) {
            if (!confirm(`Are you sure you want to delete ${number}?`)) return;
            
            try {
                const getResponse = await fetch(
                    `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${config.filePath}`,
                    {
                        headers: {
                            'Authorization': `token ${config.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (!getResponse.ok) throw new Error('Failed to get current data');
                
                const fileData = await getResponse.json();
                const sha = fileData.sha;
                const currentContent = JSON.parse(atob(fileData.content.replace(/\s/g, '')));
                
                const updatedContent = currentContent.filter(n => n.nomor !== number);
                
                const updateResponse = await fetch(
                    `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${config.filePath}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${config.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Delete number ${number}`,
                            content: btoa(JSON.stringify(updatedContent, null, 2)),
                            sha: sha
                        })
                    }
                );             
                if (!updateResponse.ok) throw new Error('Failed to update data');
                numbersData = updatedContent;
                showAddMessage(`Number ${number} deleted successfully!`, 'success');
                renderNumbers();
            } catch (error) {
                console.error('Error deleting number:', error);
                showAddMessage(`Failed to delete number: ${error.message}`, 'error');
            }
        }
        function showAddMessage(message, type) {
            addMessage.textContent = message;
            addMessage.className = `message ${type}`;
            setTimeout(() => {
                addMessage.className = 'message';
                addMessage.textContent = '';
            }, 5000);
                      }
