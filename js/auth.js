class AuthManager {
    constructor(app) {
        this.app = app;
        this.usersKey = 'fittrack_users_v2'; // New key for object storage
        this.currentUserKey = 'fittrack_current_user';
        this.users = this.loadUsers();
    }

    loadUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey)) || {};
    }

    saveUsers() {
        localStorage.setItem(this.usersKey, JSON.stringify(this.users));
    }

    createUser(username, password) {
        if (this.users[username]) return false; // Exists

        this.users[username] = { password: password };
        this.saveUsers();
        return true;
    }

    login(username, password) {
        const user = this.users[username];
        if (user && user.password === password) {
            localStorage.setItem(this.currentUserKey, username);
            this.app.storage.setPrefix(username); // Set isolated storage context
            console.log(`Logged in as: ${username}`);
            return true;
        }
        return false;
    }

    getCurrentUser() {
        return localStorage.getItem(this.currentUserKey);
    }

    logout() {
        localStorage.removeItem(this.currentUserKey);
    }
}
