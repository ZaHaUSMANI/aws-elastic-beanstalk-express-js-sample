pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running application tests...'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t assessment2-node-app:${BUILD_NUMBER} .'
            }
        }

        stage('Run Docker Container') {
            steps {
                echo 'Starting Docker container...'
                sh '''
                    docker rm -f assessment2-test-container || true
                    docker run -d --name assessment2-test-container -p 8081:8080 assessment2-node-app:${BUILD_NUMBER}
                    sleep 5
                '''
            }
        }

        stage('Test Docker Application') {
            steps {
                echo 'Testing application running inside Docker...'
                sh 'curl -f http://docker:8081'
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Cleaning up Docker container...'
                sh 'docker rm -f assessment2-test-container || true'
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'CI/CD pipeline failed. Check the stage logs for details.'
        }
    }
}
