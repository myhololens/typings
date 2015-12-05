import extend = require('xtend')
import invariant = require('invariant')
import { removeDependency, transformConfig, DefinitionOptions } from './utils/fs'
import { findProject } from './utils/find'
import { isAmbientInstall } from './utils/options'

/**
 * Uninstall options.
 */
export interface UninstallDependencyOptions {
  save?: boolean
  saveAmbient?: boolean
  saveDev?: boolean
  saveAmbientDev?: boolean
  ambient?: boolean
  cwd: string
}

/**
 * Uninstall a dependency, given a name.
 */
export function uninstallDependency (name: string, options: UninstallDependencyOptions) {
  const ambient = isAmbientInstall(options)

  // Remove the dependency from fs and config.
  function uninstall (options: DefinitionOptions) {
    return removeDependency(options).then(() => writeToConfig(name, options))
  }

  return findProject(options.cwd)
    .then(
      (cwd) => uninstall(extend(options, { cwd, name, ambient })),
      () => uninstall(extend(options, { name, ambient }))
    )
}

/**
 * Delete the dependency from the configuration file.
 */
function writeToConfig (name: string, options: UninstallDependencyOptions) {
  if (options.save || options.saveDev || options.saveAmbient || options.saveAmbientDev) {
    invariant(
      (options.save || options.saveDev) &&
      (options.ambient || options.saveAmbient || options.saveAmbientDev),
      '--save and --save-dev are incompatible with ambient dependencies'
    )

    return transformConfig(options.cwd, config => {
      if (options.save && config.dependencies) {
        delete config.dependencies[name]
      }

      if (options.saveDev && config.devDependencies) {
        delete config.devDependencies[name]
      }

      if (options.saveAmbient && config.ambientDependencies) {
        delete config.ambientDependencies[name]
      }

      if (options.saveAmbientDev && config.ambientDevDependencies) {
        delete config.ambientDevDependencies[name]
      }

      return config
    })
  }
}
