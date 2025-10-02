class QualiVerdeApp {
  constructor() {
    this.camera = null
    this.canvas = null
    this.context = null
    this.isScanning = false

    this.fruits = {
      banana: {
        name: "banana",
        displayName: "Banana",
        emoji: "🍌",
      },
      maca: {
        name: "maçã",
        displayName: "Maçã",
        emoji: "🍎",
      },
      laranja: {
        name: "laranja",
        displayName: "Laranja",
        emoji: "🍊",
      },
      mamao: {
        name: "mamão",
        displayName: "Mamão",
        emoji: "🥭",
      },
      uva: {
        name: "uva",
        displayName: "Uva",
        emoji: "🍇",
      },
      melancia: {
        name: "melancia",
        displayName: "Melancia",
        emoji: "🍉",
      },
    }

    this.init()
  }

  init() {
    this.showSplashScreen()
    this.setupEventListeners()
    this.setupCanvas()
  }

  showSplashScreen() {
    setTimeout(() => {
      document.getElementById("splash-screen").classList.add("hidden")
      document.getElementById("main-app").classList.remove("hidden")
    }, 3000)
  }

  setupEventListeners() {
    document.getElementById("start-camera").addEventListener("click", () => this.startCamera())
    document.getElementById("capture-photo").addEventListener("click", () => this.capturePhoto())
    document.getElementById("stop-camera").addEventListener("click", () => this.stopCamera())
    document.getElementById("scan-again").addEventListener("click", () => this.scanAgain())
    document.getElementById("try-again").addEventListener("click", () => this.scanAgain())
    document.getElementById("test-demo").addEventListener("click", () => this.simulateFruitDetection("maca"))

    document.querySelectorAll(".fruit-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const fruitType = e.currentTarget.dataset.fruit
        this.simulateFruitDetection(fruitType)
      })
    })
  }

  setupCanvas() {
    this.canvas = document.getElementById("capture-canvas")
    this.context = this.canvas.getContext("2d")
  }

  async startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      this.camera = await navigator.mediaDevices.getUserMedia(constraints)
      const videoElement = document.getElementById("camera-feed")
      videoElement.srcObject = this.camera

      document.getElementById("start-camera").classList.add("hidden")
      document.getElementById("capture-photo").classList.remove("hidden")
      document.getElementById("stop-camera").classList.remove("hidden")

      this.showNotification("Câmera iniciada! Aponte para uma fruta.", "success")
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error)
      this.showNotification("Erro ao acessar a câmera. Verifique as permissões.", "error")
    }
  }

  async capturePhoto() {
    const video = document.getElementById("camera-feed")
    const captureButton = document.getElementById("capture-photo")
    const captureText = document.getElementById("capture-text")

    this.canvas.width = video.videoWidth
    this.canvas.height = video.videoHeight
    this.context.drawImage(video, 0, 0)

    captureButton.disabled = true
    captureText.textContent = "Analisando..."

    try {
      console.log("[QualiVerde] Iniciando análise com IA")

      const imageBase64 = this.canvas.toDataURL("image/jpeg", 0.8).split(",")[1]
      console.log("[QualiVerde] Imagem convertida, enviando para API")

      const response = await fetch("/api/identify-fruit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64 }),
      })

      console.log("[QualiVerde] Resposta recebida, status:", response.status)
      const data = await response.json()
      console.log("[QualiVerde] Dados:", data)

      if (data.success && data.analysis) {
        this.displayAIResult(data.analysis)
      } else {
        this.showError(data.error || "Erro desconhecido", data.details)
      }
    } catch (error) {
      console.error("[QualiVerde] Erro:", error)
      this.showError("Erro de conexão. Verifique sua internet e tente novamente.", error.message)
    } finally {
      captureButton.disabled = false
      captureText.textContent = "Capturar Foto"
      this.stopCamera()
    }
  }

  displayAIResult(analysis) {
    console.log("[QualiVerde] Exibindo resultado:", analysis)

    // Find matching fruit emoji
    let fruitEmoji = "🍎"
    const fruitKey = Object.keys(this.fruits).find(
      (key) => this.fruits[key].name.toLowerCase() === analysis.fruitName.toLowerCase(),
    )
    if (fruitKey) {
      fruitEmoji = this.fruits[fruitKey].emoji
    }

    document.getElementById("fruit-icon").textContent = fruitEmoji
    document.getElementById("fruit-name").textContent = analysis.fruitName
    document.getElementById("confidence-text").textContent = `Confiança da IA: ${analysis.confidence}%`

    const qualityFill = document.getElementById("quality-fill")
    const qualityPercentage = document.getElementById("quality-percentage")
    qualityFill.style.width = analysis.qualityScore + "%"
    qualityPercentage.textContent = analysis.qualityScore + "%"

    const freshnessBadge = document.getElementById("freshness-badge")
    freshnessBadge.textContent = analysis.freshness.charAt(0).toUpperCase() + analysis.freshness.slice(1)
    freshnessBadge.className = `freshness-badge ${analysis.freshness}`

    const characteristicsList = document.getElementById("fruit-characteristics")
    characteristicsList.innerHTML = ""
    analysis.characteristics.forEach((characteristic) => {
      const li = document.createElement("li")
      li.textContent = characteristic
      characteristicsList.appendChild(li)
    })

    const recommendationsList = document.getElementById("fruit-recommendations")
    recommendationsList.innerHTML = ""
    analysis.recommendations.forEach((recommendation) => {
      const li = document.createElement("li")
      li.textContent = recommendation
      recommendationsList.appendChild(li)
    })

    document.getElementById("scanner-section").classList.add("hidden")
    document.getElementById("error-section").classList.add("hidden")
    document.getElementById("result-section").classList.remove("hidden")

    this.showNotification(`${analysis.fruitName} detectada com ${analysis.qualityScore}% de qualidade!`, "success")
  }

  showError(message, details) {
    console.log("[QualiVerde] Mostrando erro:", message, details)

    document.getElementById("error-message").textContent = message

    const errorDetails = document.getElementById("error-details")
    if (details) {
      errorDetails.textContent = `Detalhes técnicos: ${details}`
      errorDetails.style.display = "block"
    } else {
      errorDetails.style.display = "none"
    }

    document.getElementById("scanner-section").classList.add("hidden")
    document.getElementById("result-section").classList.add("hidden")
    document.getElementById("error-section").classList.remove("hidden")
  }

  simulateFruitDetection(fruitType) {
    this.showNotification(`Simulando detecção de ${this.fruits[fruitType].displayName}...`, "info")

    setTimeout(() => {
      const mockAnalysis = {
        fruitName: this.fruits[fruitType].displayName,
        confidence: Math.floor(Math.random() * 20) + 80,
        qualityScore: Math.floor(Math.random() * 30) + 70,
        characteristics: [
          "Cor vibrante e uniforme",
          "Textura adequada",
          "Sem manchas ou defeitos visíveis",
          "Tamanho apropriado",
        ],
        freshness: "boa",
        recommendations: ["Consumir em até 3 dias", "Armazenar em local fresco", "Ideal para consumo imediato"],
      }

      this.displayAIResult(mockAnalysis)
    }, 1500)
  }

  scanAgain() {
    document.getElementById("result-section").classList.add("hidden")
    document.getElementById("error-section").classList.add("hidden")
    document.getElementById("scanner-section").classList.remove("hidden")

    document.getElementById("start-camera").classList.remove("hidden")
    document.getElementById("capture-photo").classList.add("hidden")
    document.getElementById("stop-camera").classList.add("hidden")
  }

  stopCamera() {
    if (this.camera) {
      this.camera.getTracks().forEach((track) => track.stop())
      this.camera = null

      const videoElement = document.getElementById("camera-feed")
      videoElement.srcObject = null

      document.getElementById("start-camera").classList.remove("hidden")
      document.getElementById("capture-photo").classList.add("hidden")
      document.getElementById("stop-camera").classList.add("hidden")
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.textContent = message

    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "1rem 1.5rem",
      borderRadius: "10px",
      color: "white",
      fontWeight: "600",
      zIndex: "1001",
      maxWidth: "300px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease",
    })

    const colors = {
      success: "#4CAF50",
      error: "#f44336",
      info: "#2196F3",
      warning: "#ff9800",
    }

    notification.style.background = colors[type] || colors.info

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.transform = "translateX(0)"
    }, 100)

    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new QualiVerdeApp()
})

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registrado com sucesso:", registration)
      })
      .catch((registrationError) => {
        console.log("Falha no registro do SW:", registrationError)
      })
  })
}
