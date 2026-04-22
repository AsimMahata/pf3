import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

class Account {
    int accountId;
    String fullName;
    String email;
    String password;
    double balance;

    Account(int accountId, String fullName, String email, String password, double balance) {
        this.accountId = accountId;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.balance = balance;
    }
}

class Transaction {
    String type;
    double amount;
    String counterpart;
    String timestamp;

    Transaction(String type, double amount, String counterpart, String timestamp) {
        this.type = type;
        this.amount = amount;
        this.counterpart = counterpart;
        this.timestamp = timestamp;
    }
}

class AccountRepository {
    private Connection conn;

    AccountRepository() {
        attemptConnection();
        initSchema();
    }

    private void attemptConnection() {
        String url = "jdbc:mysql://database:3306/clidb";
        String dbUser = "root";
        String dbPass = "root";

        for (int attempt = 1; attempt <= 30; attempt++) {
            try {
                conn = DriverManager.getConnection(url, dbUser, dbPass);
                System.out.println("  Database connection established.");
                return;
            } catch (SQLException e) {
                e.printStackTrace(); 
                System.out.println("  Waiting for database... (" + attempt + "/30)");
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ignored) {
                }
            }
        }
        System.out.println("  Unable to reach the database after 30 attempts. Exiting.");
        System.exit(1);
    }

    private void initSchema() {
        try (Statement st = conn.createStatement()) {
            st.execute("""
                        CREATE TABLE IF NOT EXISTS accounts (
                            account_id INT PRIMARY KEY,
                            full_name  VARCHAR(255) NOT NULL,
                            email      VARCHAR(255) NOT NULL UNIQUE,
                            password   VARCHAR(255) NOT NULL,
                            balance    DOUBLE DEFAULT 0.0
                        )
                    """);
            st.execute("""
                        CREATE TABLE IF NOT EXISTS transactions (
                            txn_id      INT AUTO_INCREMENT PRIMARY KEY,
                            account_id  INT NOT NULL,
                            type        VARCHAR(50) NOT NULL,
                            amount      DOUBLE NOT NULL,
                            counterpart VARCHAR(255),
                            created_at  VARCHAR(30) NOT NULL
                        )
                    """);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    List<Account> fetchAll() {
        List<Account> result = new ArrayList<>();
        try (Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery("SELECT * FROM accounts")) {
            while (rs.next()) {
                result.add(new Account(
                        rs.getInt("account_id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("password"),
                        rs.getDouble("balance")));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }

    boolean emailExists(String email) {
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM accounts WHERE email = ?")) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            return rs.next();
        } catch (SQLException e) {
            return false;
        }
    }

    void persist(Account a) {
        String sql = """
                    INSERT INTO accounts (account_id, full_name, email, password, balance)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE full_name=?, email=?, password=?, balance=?
                """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, a.accountId);
            ps.setString(2, a.fullName);
            ps.setString(3, a.email);
            ps.setString(4, a.password);
            ps.setDouble(5, a.balance);
            ps.setString(6, a.fullName);
            ps.setString(7, a.email);
            ps.setString(8, a.password);
            ps.setDouble(9, a.balance);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    void recordTransaction(int accountId, String type, double amount, String counterpart) {
        String when = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO transactions (account_id, type, amount, counterpart, created_at) VALUES (?, ?, ?, ?, ?)")) {
            ps.setInt(1, accountId);
            ps.setString(2, type);
            ps.setDouble(3, amount);
            ps.setString(4, counterpart);
            ps.setString(5, when);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    List<Transaction> fetchHistory(int accountId) {
        List<Transaction> history = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT * FROM transactions WHERE account_id = ? ORDER BY txn_id DESC LIMIT 10")) {
            ps.setInt(1, accountId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                history.add(new Transaction(
                        rs.getString("type"),
                        rs.getDouble("amount"),
                        rs.getString("counterpart"),
                        rs.getString("created_at")));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return history;
    }
}

class PaymentService {
    private final AccountRepository repo = new AccountRepository();
    private final Map<Integer, Account> accounts = new HashMap<>();

    PaymentService() {
        for (Account a : repo.fetchAll())
            accounts.put(a.accountId, a);
    }

    private int generateUniqueId() {
        Random rand = new Random();
        int newId;
        do {
            newId = rand.nextInt(9000) + 1000;
        } while (accounts.containsKey(newId));
        return newId;
    }

    String registerAccount(String fullName, String email, String password) {
        if (repo.emailExists(email))
            return null;
        int newId = generateUniqueId();
        Account fresh = new Account(newId, fullName, email, password, 0.0);
        accounts.put(newId, fresh);
        repo.persist(fresh);
        return String.valueOf(newId);
    }

    Account authenticate(String email, String password) {
        for (Account a : accounts.values())
            if (a.email.equals(email) && a.password.equals(password))
                return a;
        return null;
    }

    Collection<Account> allAccounts() {
        return accounts.values();
    }

    Account findById(int id) {
        return accounts.get(id);
    }

    String transferFunds(Account sender, int receiverId, double amount) {
        if (amount <= 0)
            return "Amount must be greater than zero.";
        Account receiver = accounts.get(receiverId);
        if (receiver == null)
            return "Recipient account not found.";
        if (sender.accountId == receiverId)
            return "You cannot send money to yourself.";
        if (sender.balance < amount)
            return "Insufficient funds. Your balance is Rs " + String.format("%.2f", sender.balance) + ".";

        sender.balance -= amount;
        receiver.balance += amount;
        repo.persist(sender);
        repo.persist(receiver);
        repo.recordTransaction(sender.accountId, "DEBIT", amount, receiver.fullName);
        repo.recordTransaction(receiver.accountId, "CREDIT", amount, sender.fullName);
        return "ok";
    }

    String withdraw(Account acc, double amount) {
        if (amount <= 0)
            return "Amount must be greater than zero.";
        if (acc.balance < amount)
            return "Insufficient funds. Available balance: Rs " + String.format("%.2f", acc.balance) + ".";
        acc.balance -= amount;
        repo.persist(acc);
        repo.recordTransaction(acc.accountId, "WITHDRAW", amount, "-");
        return "ok";
    }

    void addFunds(Account acc, double amount) {
        acc.balance += amount;
        repo.persist(acc);
        repo.recordTransaction(acc.accountId, "DEPOSIT", amount, "-");
    }

    boolean updatePassword(Account acc, String currentPassword, String newPassword) {
        if (!acc.password.equals(currentPassword))
            return false;
        acc.password = newPassword;
        repo.persist(acc);
        return true;
    }

    List<Transaction> getHistory(int accountId) {
        return repo.fetchHistory(accountId);
    }
}

public class App {
    private static final Scanner sc = new Scanner(System.in);
    private static final PaymentService service = new PaymentService();

    private static final String LINE = "  +------------------------------------------+";
    private static final String THIN = "  ------------------------------------------";

    private static int readInt() {
        while (true) {
            try {
                return Integer.parseInt(sc.nextLine().trim());
            } catch (Exception e) {
                System.out.print("  Please enter a valid number: ");
            }
        }
    }

    private static double readAmount() {
        while (true) {
            try {
                double val = Double.parseDouble(sc.nextLine().trim());
                if (val < 0) {
                    System.out.print("  Amount cannot be negative: ");
                    continue;
                }
                return val;
            } catch (Exception e) {
                System.out.print("  Please enter a valid amount: ");
            }
        }
    }

    private static String prompt(String label) {
        System.out.print("  " + label);
        return sc.nextLine().trim();
    }

    private static void header(String title) {
        System.out.println();
        System.out.println(LINE);
        System.out.printf("  | %-42s |%n", title);
        System.out.println(LINE);
    }

    private static void printAccountDirectory() {
        header("Account Directory");
        System.out.printf("  %-10s  %-25s  %s%n", "Acc. No.", "Name", "Email");
        System.out.println(THIN);
        Collection<Account> all = service.allAccounts();
        if (all.isEmpty()) {
            System.out.println("  No accounts registered yet.");
        } else {
            for (Account a : all)
                System.out.printf("  %-10d  %-25s  %s%n", a.accountId, a.fullName, a.email);
        }
        System.out.println();
    }

    private static void signup() {
        header("Open New Account");
        String fullName = prompt("Full name   : ");
        if (fullName.isEmpty()) {
            System.out.println("  Name cannot be blank.");
            return;
        }
        String email = prompt("Email       : ");
        if (!email.contains("@")) {
            System.out.println("  Please enter a valid email address.");
            return;
        }
        String password = prompt("Password    : ");
        if (password.length() < 6) {
            System.out.println("  Password must be at least 6 characters.");
            return;
        }
        String confirm = prompt("Confirm pwd : ");
        if (!password.equals(confirm)) {
            System.out.println("  Passwords do not match.");
            return;
        }

        String newAccountId = service.registerAccount(fullName, email, password);
        if (newAccountId == null) {
            System.out.println("  An account with that email already exists.");
        } else {
            System.out.println();
            System.out.println("  Account created successfully!");
            System.out.println("  Your account number: " + newAccountId);
            System.out.println("  Keep this number safe — you will need it for transfers.");
        }
        System.out.println();
    }

    private static void login() {
        header("Sign In");
        String email = prompt("Email    : ");
        String password = prompt("Password : ");

        Account user = service.authenticate(email, password);
        if (user == null) {
            System.out.println("  Incorrect email or password. Please try again.");
            System.out.println();
            return;
        }
        dashboard(user);
    }

    private static void dashboard(Account user) {
        while (true) {
            System.out.println();
            System.out.println(LINE);
            System.out.printf("  | %-42s |%n", "Welcome, " + user.fullName);
            System.out.printf("  | %-42s |%n", "Account No: " + user.accountId);
            System.out.println(LINE);
            System.out.println("  |  1. Check Balance                        |");
            System.out.println("  |  2. Deposit Funds                        |");
            System.out.println("  |  3. Withdraw Cash                        |");
            System.out.println("  |  4. Send Money                           |");
            System.out.println("  |  5. Transaction History                  |");
            System.out.println("  |  6. Account Info                         |");
            System.out.println("  |  7. Change Password                      |");
            System.out.println("  | -1. Sign Out                             |");
            System.out.println(LINE);
            System.out.print("  Select option: ");

            int choice = readInt();
            switch (choice) {
                case 1 -> checkBalance(user);
                case 2 -> depositFunds(user);
                case 3 -> withdrawCash(user);
                case 4 -> sendMoney(user);
                case 5 -> showHistory(user);
                case 6 -> accountInfo(user);
                case 7 -> changePassword(user);
                case -1 -> {
                    System.out.println("  Signed out. Have a good day!");
                    System.out.println();
                    return;
                }
                default -> System.out.println("  That option is not available. Please choose from the menu.");
            }
        }
    }

    private static void checkBalance(Account user) {
        System.out.println();
        System.out.println(THIN);
        System.out.printf("  Available Balance: Rs %s%n", String.format("%.2f", user.balance));
        System.out.println(THIN);
    }

    private static void depositFunds(Account user) {
        header("Deposit Funds");
        System.out.print("  Amount (Rs): ");
        double amount = readAmount();
        if (amount == 0) {
            System.out.println("  Nothing to deposit.");
            return;
        }
        service.addFunds(user, amount);
        System.out.printf("  Rs %.2f deposited. New balance: Rs %.2f%n", amount, user.balance);
        System.out.println();
    }

    private static void withdrawCash(Account user) {
        header("Withdraw Cash");
        System.out.printf("  Available: Rs %.2f%n", user.balance);
        System.out.print("  Amount (Rs): ");
        double amount = readAmount();
        String outcome = service.withdraw(user, amount);
        if (outcome.equals("ok")) {
            System.out.printf("  Rs %.2f withdrawn. Remaining balance: Rs %.2f%n", amount, user.balance);
        } else {
            System.out.println("  " + outcome);
        }
        System.out.println();
    }

    private static void sendMoney(Account user) {
        header("Send Money");
        printAccountDirectory();
        System.out.print("  Recipient account number: ");
        int receiverId = readInt();
        System.out.print("  Amount (Rs): ");
        double amount = readAmount();

        String result = service.transferFunds(user, receiverId, amount);
        if (result.equals("ok")) {
            Account recv = service.findById(receiverId);
            System.out.printf("  Rs %.2f sent to %s successfully.%n", amount, recv.fullName);
            System.out.printf("  Your new balance: Rs %.2f%n", user.balance);
        } else {
            System.out.println("  Transfer failed: " + result);
        }
        System.out.println();
    }

    private static void showHistory(Account user) {
        header("Last 10 Transactions");
        List<Transaction> txns = service.getHistory(user.accountId);
        if (txns.isEmpty()) {
            System.out.println("  No transactions on record yet.");
        } else {
            System.out.printf("  %-10s  %-10s  %-20s  %s%n", "Type", "Amount", "Party", "Date & Time");
            System.out.println(THIN);
            for (Transaction t : txns) {
                System.out.printf("  %-10s  Rs %-7.2f  %-20s  %s%n",
                        t.type, t.amount, t.counterpart, t.timestamp);
            }
        }
        System.out.println();
    }

    private static void accountInfo(Account user) {
        header("Account Information");
        System.out.printf("  %-18s %s%n", "Account Number:", user.accountId);
        System.out.printf("  %-18s %s%n", "Name:", user.fullName);
        System.out.printf("  %-18s %s%n", "Email:", user.email);
        System.out.printf("  %-18s Rs %.2f%n", "Current Balance:", user.balance);
        System.out.println();
    }

    private static void changePassword(Account user) {
        header("Change Password");
        String current = prompt("Current password : ");
        String newPwd = prompt("New password     : ");
        if (newPwd.length() < 6) {
            System.out.println("  Password must be at least 6 characters.");
            return;
        }
        String confirmPwd = prompt("Confirm new pwd  : ");
        if (!newPwd.equals(confirmPwd)) {
            System.out.println("  Passwords do not match.");
            return;
        }

        boolean changed = service.updatePassword(user, current, newPwd);
        System.out.println(changed ? "  Password updated successfully." : "  Current password is incorrect.");
        System.out.println();
    }

    public static void main(String[] args) {
        System.out.println();
        System.out.println("  ==========================================");
        System.out.println("          PayEase  —  Banking Terminal       ");
        System.out.println("  ==========================================");

        while (true) {
            System.out.println();
            System.out.println(LINE);
            System.out.println("  |  1. Sign In                              |");
            System.out.println("  |  2. Open New Account                     |");
            System.out.println("  |  3. Account Directory                    |");
            System.out.println("  | -1. Exit                                 |");
            System.out.println(LINE);
            System.out.print("  Select option: ");

            int choice = readInt();
            switch (choice) {
                case 1 -> login();
                case 2 -> signup();
                case 3 -> printAccountDirectory();
                case -1 -> {
                    System.out.println("  Goodbye.");
                    System.exit(0);
                }
                default -> System.out.println("  Invalid option. Please try again.");
            }
        }
    }
}
