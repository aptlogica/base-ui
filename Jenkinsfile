pipeline {
  agent any

  stages {
    stage('Checkout Code') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Run Tests with Coverage') {
      steps {
        sh 'npm run test:coverage'
      }
    }

    stage('SonarQube Analysis') {
      steps {
        script {
          sh 'pwd'
          sh 'ls -la'
          sh 'ls -la coverage-vitest || true'
          sh 'head -n 5 coverage-vitest/lcov.info || true'
          // Get path to the installed Sonar Scanner tool
          def scannerHome = tool 'SonarScanner'

          withSonarQubeEnv('aptl-sonar') {
            // Run the scanner binary
            sh "${scannerHome}/bin/sonar-scanner"
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 10, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }
  }
}
