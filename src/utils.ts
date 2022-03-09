import ora from 'ora'

export const spinner = ora() // new Spinner();

// stops the spinner if it is spinning
export const stopSpinner = () => {
  if (spinner.isSpinning) {
    spinner.stop()
  }
}
