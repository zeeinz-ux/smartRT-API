import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import PaymentSetting from '#models/payment_setting'
import { DateTime } from 'luxon'

test.group('Payment Settings - Model Layer', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin can create payment settings', async ({ assert }) => {
    const setting = await PaymentSetting.create({
      nama_bank: 'Bank Test',
      nomor_rekening: '1234567890',
      nama_penerima: 'Bendahara RT',
    })

    assert.isTrue(setting.$isPersisted)
    assert.equal(setting.nama_bank, 'Bank Test')
    assert.equal(setting.nomor_rekening, '1234567890')
    assert.equal(setting.nama_penerima, 'Bendahara RT')
  })

  test('admin can update payment settings', async ({ assert }) => {
    const setting = await PaymentSetting.create({
      nama_bank: 'Bank Lama',
      nomor_rekening: '111111',
      nama_penerima: 'Bendahara',
    })

    setting.nama_bank = 'Bank Baru'
    setting.nomor_rekening = '999999'
    await setting.save()

    await setting.refresh()
    assert.equal(setting.nama_bank, 'Bank Baru')
    assert.equal(setting.nomor_rekening, '999999')
  })

  test('admin can delete payment settings', async ({ assert }) => {
    const setting = await PaymentSetting.create({
      nama_bank: 'Bank Test',
      nomor_rekening: '12345',
      nama_penerima: 'Bendahara',
    })

    await setting.delete()

    const found = await PaymentSetting.find(setting.id)
    assert.isNull(found)
  })
})