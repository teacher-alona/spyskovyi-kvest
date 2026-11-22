// Приклади для SwiftUI-пісочниці
window.SW_EXAMPLES = [
["Новий файл", `import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Привіт, світе!")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
`],
["Візитівка", `import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.crop.circle.fill")
                .font(.system(size: 90))
                .foregroundColor(.indigo)
            Text("Оля Коваленко")
                .font(.title)
                .bold()
            Text("Юна розробниця iOS")
                .foregroundStyle(.secondary)
            HStack(spacing: 20) {
                Label("Київ", systemImage: "mappin")
                Label("7-А", systemImage: "graduationcap")
            }
            .font(.callout)
        }
        .padding(30)
        .background(Color.indigo.opacity(0.1))
        .cornerRadius(24)
    }
}

#Preview {
    ContentView()
}
`],
["Лічильник", `import SwiftUI

struct ContentView: View {
    @State private var count = 0

    var body: some View {
        VStack(spacing: 24) {
            Text("\\(count)")
                .font(.system(size: 80, weight: .bold))
                .foregroundColor(count < 0 ? .red : .primary)
            HStack(spacing: 16) {
                Button("−1") { count -= 1 }
                    .buttonStyle(.bordered)
                Button("+1") { count += 1 }
                    .buttonStyle(.borderedProminent)
            }
            Button("Скинути") { count = 0 }
                .foregroundColor(.red)
        }
    }
}

#Preview {
    ContentView()
}
`],
["Кубик", `import SwiftUI

struct ContentView: View {
    @State private var value = 1

    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "die.face.\\(value).fill")
                .font(.system(size: 120))
            Text("Випало: \\(value)")
                .font(.title2)
            Button("Кинути кубик") {
                value = Int.random(in: 1...6)
            }
            .buttonStyle(.borderedProminent)
            .tint(.purple)
        }
    }
}

#Preview {
    ContentView()
}
`],
["Привітання", `import SwiftUI

struct ContentView: View {
    @State private var name = ""
    @State private var loud = false

    var body: some View {
        VStack(spacing: 20) {
            TextField("Як тебе звати?", text: $name)
                .textFieldStyle(.roundedBorder)
            Toggle("Кричати", isOn: $loud)
            Text(name.isEmpty ? "Напиши своє ім'я" : "Привіт, \\(name)!")
                .font(loud ? .largeTitle : .title3)
                .foregroundColor(loud ? .orange : .primary)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
`],
["Список справ", `import SwiftUI

struct ContentView: View {
    @State private var tasks = ["Зробити уроки", "Погодувати кота"]
    @State private var newTask = ""

    var body: some View {
        NavigationStack {
            List {
                Section("Нова справа") {
                    HStack {
                        TextField("Що треба зробити?", text: $newTask)
                        Button("Додати") {
                            if !newTask.isEmpty {
                                tasks.append(newTask)
                                newTask = ""
                            }
                        }
                    }
                }
                Section("Справи: \\(tasks.count)") {
                    ForEach(tasks, id: \\.self) { task in
                        Label(task, systemImage: "circle")
                    }
                }
            }
            .navigationTitle("Мій день")
        }
    }
}

#Preview {
    ContentView()
}
`],
["Навігація", `import SwiftUI

struct ContentView: View {
    let planets = ["Меркурій", "Венера", "Земля", "Марс"]

    var body: some View {
        NavigationStack {
            List(planets, id: \\.self) { planet in
                NavigationLink(planet) {
                    PlanetView(name: planet)
                }
            }
            .navigationTitle("Планети")
        }
    }
}

struct PlanetView: View {
    let name: String

    var body: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(name == "Марс" ? .red : .blue)
                .frame(width: 150, height: 150)
            Text(name)
                .font(.largeTitle)
        }
        .navigationTitle(name)
    }
}

#Preview {
    ContentView()
}
`],
["Картки", `import SwiftUI

struct ContentView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                PetCard(name: "Кекс", info: "кіт · 3 роки", color: .orange)
                PetCard(name: "Зевс", info: "кіт · 1 рік", color: .gray)
                PetCard(name: "Кеша", info: "папуга · 2 роки", color: .green)
            }
            .padding()
        }
    }
}

struct PetCard: View {
    let name: String
    let info: String
    let color: Color

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: "pawprint.fill")
                .font(.title)
                .foregroundColor(.white)
                .frame(width: 56, height: 56)
                .background(color)
                .clipShape(Circle())
            VStack(alignment: .leading) {
                Text(name).font(.headline)
                Text(info).foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(.white)
        .cornerRadius(16)
        .shadow(radius: 4)
    }
}

#Preview {
    ContentView()
}
`],
];
